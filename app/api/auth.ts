import { NextRequest } from "next/server";
import { getServerSideConfig } from "../config/server";
import md5 from "spark-md5";
import ObjCache from "./objCache";
import {
  ACCESS_CODE_PREFIX,
  ACCESS_AUTH_PREFIX,
  ModelProvider,
} from "../constant";

function getIP(req: NextRequest) {
  let ip = req.ip ?? req.headers.get("x-real-ip");
  const forwardedFor = req.headers.get("x-forwarded-for");

  if (!ip && forwardedFor) {
    ip = forwardedFor.split(",").at(0) ?? "";
  }

  return ip;
}

function hashCode(str: string) {
  if (!str) {
    throw new Error("invalid string");
  }
  const hashedCode = md5.hash(str ?? "").trim();
  return hashedCode;
}

function parseApiKey(bearToken: string) {
  const token = bearToken.trim().replaceAll("Bearer ", "").trim();
  const isAccessCode = token.startsWith(ACCESS_CODE_PREFIX);
  const isOauthToken = token.startsWith(ACCESS_AUTH_PREFIX);

  return {
    oauthToken: isOauthToken ? token.slice(ACCESS_AUTH_PREFIX.length) : "",
    accessCode: isAccessCode ? token.slice(ACCESS_CODE_PREFIX.length) : "",
    apiKey: !isAccessCode && !isOauthToken ? token : "",
  };
}

const DomainHost = "https://prod-sdk-api.my.webinfra.cloud";
const cacheKeyPerDayTTL = 3600 * 24;

const getCustomerInfo = async (userToken: string) => {
  const curDateStr = new Date().toDateString().replace(/\s/gim, "-");
  const cacheKey = `cnt-${hashCode(userToken)}`;

  console.log("cache key - ", cacheKey);
  try {
    const cacheData = await ObjCache.get(cacheKey);
    if (cacheData?.date === curDateStr) {
      console.log("cache hit: ", cacheData?.date, cacheKey);
      if ((cacheData.data as any)?.profile?.amount > 0) {
        console.log("valid cache data");
        return cacheData.data;
      }
    }
  } catch (error) {
    console.error("upstash error: ", error);
  }

  const serverConfig = getServerSideConfig();
  const params: Record<string, unknown> = {
    input: {},
  };
  const queryString = Object.keys(params)
    .map((key) => {
      const value = encodeURIComponent(JSON.stringify(params[key]));
      return `${encodeURIComponent(key)}=${value}`;
    })
    .join("&");
  const sdkHost = `${serverConfig?.host || DomainHost}/flowda-api/trpc/customerAuthV4.getUser?${queryString}`;
  console.log(" - ", sdkHost);
  return fetch(sdkHost, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userToken}`,
    },
  })
    .then((resp) => resp.json())
    .then(
      (resp) => {
        console.log("resp ", resp);
        const data = resp?.result.data;
        try {
          ObjCache.set(
            cacheKey,
            {
              date: curDateStr,
              data: data,
            },
            {
              ex: cacheKeyPerDayTTL, // 1 day
            },
          );
        } catch (error) {
          console.error("upstash error: ", error);
        }

        return data;
      },
      (error) => {
        console.error("catched: ", error);
        throw new Error("get user info failed");
      },
    );
};

export const checkLimit = async (token: string) => {
  console.log("checking limit", token);

  const userInfo = await getCustomerInfo(token);
  console.log("resp - ", userInfo);
  const profile = userInfo.orderProfile;
  // 强制用户订阅，免费版或者付费版二选一
  if (!profile) {
    return {
      success: false,
      message: "User unauthorized",
    };
  }
  //  有付费额度
  if (
    profile?.amount > 0 &&
    new Date(profile.expireAt || Date.now() + 1000).valueOf() > Date.now()
  ) {
    userAmountFeedback(token);
    return {
      success: true,
      data: {
        cnt: profile.amount - 1,
      },
    };
  } else {
    console.log(" no valid amount ");
    return {
      success: false,
      message: "Request Limited",
    };
  }
};

export const userAmountFeedback = async (token: string) => {
  if (!token) {
    console.log("no oauth token parsed");
    return;
  }
  console.log("user profile amount update - ", token);
  // 付费额度更新
  const serverConfig = getServerSideConfig();
  const sdkHost = `${serverConfig?.host || DomainHost}/flowda-api/trpc/customerAuthV4.amountUpdate`;
  return fetch(sdkHost, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      action: "decrement",
      count: 1,
    }),
  })
    .then((resp) => resp.json())
    .then((resp) => {
      const updatedUserInfo = resp.result.data;
      console.log("refresh remote profile", updatedUserInfo);
      if (updatedUserInfo?.profile) {
        try {
          const curDateStr = new Date().toDateString().replace(/\s/gim, "-");
          const cacheKey = `cnt-${token.slice(0, 12)}`;
          ObjCache.set(
            cacheKey,
            {
              date: curDateStr,
              data: updatedUserInfo,
            },
            {
              ex: cacheKeyPerDayTTL, // 1 day
            },
          );
        } catch (error) {
          console.error("upstash error: ", error);
        }

        return updatedUserInfo;
      }
    });
};

export async function auth(
  req: NextRequest,
  isCost: boolean,
  modelProvider: ModelProvider,
) {
  const authToken = req.headers.get("Authorization") ?? "";

  // check if it is openai api key or user token
  const { accessCode, apiKey: token, oauthToken } = parseApiKey(authToken);

  const hashedCode = md5.hash(accessCode ?? "").trim();

  const serverConfig = getServerSideConfig();
  console.log("[Auth] allowed hashed codes: ", [...serverConfig.codes]);
  console.log("[Auth] got access code:", accessCode);
  console.log("[Auth] hashed access code:", hashedCode);
  console.log("[User IP] ", getIP(req));
  console.log("[Time] ", new Date().toLocaleString());

  if (
    serverConfig.needCode &&
    !serverConfig.codes.has(hashedCode) &&
    !token &&
    !oauthToken
  ) {
    return {
      error: true,
      msg: "NeedAuth",
    };
  }

  let cnt = 0;
  // if user does not provide an api key, inject system api key
  if (!token) {
    const serverConfig = getServerSideConfig();

    console.log("free mode: ", serverConfig.freeMode);
    console.log("oauth: ", oauthToken, isCost);
    if (oauthToken && isCost && !serverConfig.freeMode) {
      const { success, data, message } = await checkLimit(oauthToken);
      if (!success) {
        console.log("check oauth limit failed: ", message);
        return {
          error: true,
          msg: "Amount limited",
        };
      }
      console.log("oatuh check pass: ", data);
      if (typeof data?.cnt === "number") {
        cnt = data?.cnt;
      }
    }

    // const systemApiKey =
    //   modelProvider === ModelProvider.GeminiPro
    //     ? serverConfig.googleApiKey
    //     : serverConfig.isAzure
    //     ? serverConfig.azureApiKey
    //     : serverConfig.apiKey;

    let systemApiKey: string | undefined;

    switch (modelProvider) {
      case ModelProvider.GeminiPro:
        systemApiKey = serverConfig.googleApiKey;
        break;
      case ModelProvider.Claude:
        systemApiKey = serverConfig.anthropicApiKey;
        break;
      case ModelProvider.GPT:
      default:
        if (serverConfig.isAzure) {
          systemApiKey = serverConfig.azureApiKey;
        } else {
          systemApiKey = serverConfig.apiKey;
        }
    }

    if (systemApiKey) {
      console.log("[Auth] use system api key");
      req.headers.set("Authorization", `Bearer ${systemApiKey}`);
    } else {
      console.log("[Auth] admin did not provide an api key");
    }
  } else {
    console.log("[Auth] use user api key");
  }

  return {
    error: false,
    cnt,
  };
}
