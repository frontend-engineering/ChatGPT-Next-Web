import { create } from "zustand";
import { persist } from "zustand/middleware";
import Cashier, { TUserInfo } from "@cashier/web";
import { isMobile } from "../utils";
import { showToast } from "../components/ui-lib";
import {
  ApiPath,
  DEFAULT_API_HOST,
  ServiceProvider,
  StoreKey,
} from "../constant";
import { getHeaders } from "../client/api";
import { getClientConfig } from "../config/client";
import { createPersistStore } from "../utils/store";
import { ensure } from "../utils/clone";
export interface AccessControlStore {
  accessCode: string;
  token: string;
  authAccount: TUserInfo;
  authAT: string;

  needCode: boolean;
  hideUserApiKey: boolean;
  openaiUrl: string;
  appId: string;
  appToken: string;

  cacheDate: number;

  login: () => Promise<void>;
  logout: () => Promise<void>;
  can: () => Promise<boolean>;
  purchase: () => Promise<boolean>;
  isPaidUser: () => boolean;
  updateProfile: (refresh?: boolean) => any;
  updateToken: (_: string) => void;
  updateCode: (_: string) => void;
  updateOpenAiUrl: (_: string) => void;
  enabledAccessControl: () => boolean;
  isAuthorized: () => boolean;
  fetch: () => void;
  sdkInit: () => Promise<void> | void;
}

let fetchState = 0; // 0 not fetch, 1 fetching, 2 done
let sdk: Cashier | null = null;

const DEFAULT_OPENAI_URL =
  getClientConfig()?.buildMode === "export"
    ? DEFAULT_API_HOST + "/api/proxy/openai"
    : ApiPath.OpenAI;

const DEFAULT_ACCESS_STATE = {
  appId: "",
  appToken: "",
  token: "",
  authAccount: null as unknown as TUserInfo,
  authAT: "",
  cacheDate: 0,

  accessCode: "",
  useCustomConfig: false,

  provider: ServiceProvider.OpenAI,

  // openai
  openaiUrl: DEFAULT_OPENAI_URL,
  openaiApiKey: "",

  // azure
  azureUrl: "",
  azureApiKey: "",
  azureApiVersion: "2023-08-01-preview",

  // google ai studio
  googleUrl: "",
  googleApiKey: "",
  googleApiVersion: "v1",

  // anthropic
  anthropicApiKey: "",
  anthropicApiVersion: "2023-06-01",
  anthropicUrl: "",

  // server config
  needCode: true,
  hideUserApiKey: false,
  hideBalanceQuery: false,
  disableGPT4: false,
  disableFastLink: false,
  customModels: "",

  sdkInit: () => {
    console.log("sdk init empty implement");
  },
  login: () => {
    console.log("login empty implement");
  },
};

export const useAccessStore = createPersistStore(
  { ...DEFAULT_ACCESS_STATE },

  (set, get) => ({
    token: "",
    accessCode: "",
    authAccount: null as unknown as TUserInfo,
    authAT: "",
    needCode: true as boolean,
    hideUserApiKey: false as boolean,
    appId: process.env.APP_ID,
    appToken: process.env.APP_TOKEN,
    openaiUrl: DEFAULT_OPENAI_URL,
    cacheDate: 0,
    enabledAccessControl() {
      this.fetch();

      return get().needCode || !!get().appId;
    },

    isValidOpenAI() {
      return ensure(get(), ["openaiApiKey"]);
    },

    isValidAzure() {
      return ensure(get(), ["azureUrl", "azureApiKey", "azureApiVersion"]);
    },

    isValidGoogle() {
      return ensure(get(), ["googleApiKey"]);
    },

    isValidAnthropic() {
      return ensure(get(), ["anthropicApiKey"]);
    },

    updateCode(code: string) {
      set(() => ({ accessCode: code }));
    },
    updateToken(token: string) {
      set(() => ({ token }));
    },

    async login() {
      if (get().authAccount) {
        console.log("account info: ", get().authAccount);
        return;
      }
      await get().sdkInit();
      const info = await sdk?.login();
      const tokens = await sdk?.getTokens();

      if (info && tokens) {
        set(() => ({
          authAccount: info || null,
          authAT: tokens?.accessToken,
          cacheDate: Date.now(),
        }));
      }
    },
    async logout() {
      if (!get().authAccount) {
        console.log("account info: ", get().authAccount);
        return;
      }
      await get().sdkInit();
      await sdk?.logout();
      set(() => ({
        authAccount: null as unknown as TUserInfo,
        authAT: undefined,
      }));
    },

    async can() {
      const info = get().authAccount;
      console.log("authed info: ", info);
      if (!info) {
        await get().login();
      }
      console.log("can check: ", info);
      if (info?.profile?.amount && info?.profile?.amount > 1) {
        return true;
      }
      return false;
    },

    async purchase() {
      const info = get().authAccount;
      console.log("authed info: ", info);
      if (!info || !sdk) {
        await get().sdkInit();
      }
      try {
        const resp = await sdk?.purchase({});
        console.log("purchase resp: ", resp);
        if (resp?.success) {
          showToast("订阅成功");
          set(() => ({ authAccount: resp.user as TUserInfo }));
          return true;
        }
        showToast("订阅失败");
        return false;
      } catch (error: any) {
        console.error("purchase failed: ", error);
        showToast(error?.message);
        return false;
      }
    },

    isPaidUser() {
      const curCnt = get().authAccount?.profile?.amount;
      if (curCnt && curCnt > 30) {
        return true;
      }
      return false;
    },

    async updateProfile(refresh?: boolean) {
      if (!sdk) {
        await get().sdkInit();
      }

      if (refresh || Date.now() - get().cacheDate > 3600000) {
        const updated = await sdk?.getUserInfo({
          refresh: true,
        });

        if (updated) {
          set(() => ({
            authAccount: updated as TUserInfo,
            cacheDate: Date.now(),
          }));
        }
        return;
      }

      const info = get().authAccount;
      console.log("authed info: ", info);
      if (!info) {
        await get().login();
      }

      if (!info) {
        throw new Error("User data not found");
      }
      if (info.profile?.amount && info.profile?.amount > 0) {
        set(() => ({
          authAccount: {
            ...info,
            profile: {
              ...info.profile,
              amount: info.profile?.amount ? info.profile.amount - 1 : 0,
            },
          } as TUserInfo,
        }));
      }
    },

    updateOpenAiUrl(url: string) {
      set(() => ({ openaiUrl: url }));
    },
    isAuthorized() {
      this.fetch();

      // has token or has code or disabled access control
      return (
        this.isValidOpenAI() ||
        this.isValidAzure() ||
        this.isValidGoogle() ||
        this.isValidAnthropic() ||
        !!this.token ||
        !!this.accessCode ||
        !!this.authAT ||
        !this.enabledAccessControl() ||
        (this.enabledAccessControl() && ensure(get(), ["accessCode"]))
      );
    },
    fetch() {
      if (fetchState > 0 || getClientConfig()?.buildMode === "export") return;
      fetchState = 1;
      fetch("/api/config", {
        method: "post",
        body: null,
        headers: {
          ...getHeaders(),
        },
      })
        .then((res) => res.json())
        .then((res: DangerConfig) => {
          console.log("[Config] got config from server", res);
          set(() => ({ ...res }));
        })
        .catch(() => {
          console.error("[Config] failed to fetch config");
        })
        .finally(() => {
          fetchState = 2;
        });
    },

    async sdkInit() {
      if (sdk) return;
      this.fetch();
      if (fetchState !== 2) {
        // fetching remote config
        return new Promise((resolve) => {
          setTimeout(() => {
            console.log("pending for fetch....");
            resolve(this.sdkInit());
          }, 2000);
        });
      }
      const { appId, appToken } = get();
      if (!appId || !appToken) {
        return;
      }
      const mobileDevice = isMobile();
      console.log("mobile device init sdk: ", mobileDevice);
      sdk = new Cashier({
        appId,
        appToken,
        // pageDomain: 'http://localhost:3001',
        mobile: mobileDevice,
      });
      await sdk.init();

      const info = await sdk.getUserInfo();
      const tokens = await sdk?.getTokens();
      if (info && tokens) {
        set(() => ({
          authAccount: (info || null) as unknown as TUserInfo,
          authAT: tokens?.accessToken,
        }));
      }
      return;
    },
  }),
  {
    name: StoreKey.Access,
    version: 2,
    migrate(persistedState, version) {
      if (version < 2) {
        const state = persistedState as {
          token: string;
          openaiApiKey: string;
          azureApiVersion: string;
          googleApiKey: string;
        };
        state.openaiApiKey = state.token;
        state.azureApiVersion = "2023-08-01-preview";
      }

      return persistedState as any;
    },
  },
);
