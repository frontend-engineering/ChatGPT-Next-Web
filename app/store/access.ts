import { create } from "zustand";
import { persist } from "zustand/middleware";
import Cashier, { TUserInfo } from "@cashier/web";
import { StoreKey } from "../constant";
import { getHeaders } from "../client/api";
import { BOT_HELLO } from "./chat";
import { ALL_MODELS } from "./config";
import { isMobile } from "../utils";
import { showToast } from "../components/ui-lib";
export interface AccessControlStore {
  accessCode: string;
  token: string;
  authAccount: TUserInfo | null;
  authAT: string;

  needCode: boolean;
  hideUserApiKey: boolean;
  openaiUrl: string;
  appId: string;
  appToken: string;

  login: () => Promise<void>;
  logout: () => Promise<void>;
  can: () => Promise<boolean>;
  purchase: () => Promise<boolean>;
  updateToken: (_: string) => void;
  updateCode: (_: string) => void;
  enabledAccessControl: () => boolean;
  isAuthorized: () => boolean;
  fetch: () => void;
  sdkInit: () => Promise<void> | void;
}

let fetchState = 0; // 0 not fetch, 1 fetching, 2 done
let sdk: Cashier | null = null;

export const useAccessStore = create<AccessControlStore>()(
  persist(
    (set, get) => ({
      token: "",
      accessCode: "",
      authAccount: null,
      authAT: "",
      needCode: true,
      hideUserApiKey: false,
      openaiUrl: "/api/openai/",
      appId: "",
      appToken: "",

      enabledAccessControl() {
        get().fetch();

        return get().needCode;
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
        console.log("---- info----", info);
        const tokens = await sdk?.getTokens();

        if (info && tokens) {
          set(() => ({
            authAccount: info || null,
            authAT: tokens?.accessToken,
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
        set(() => ({ authAccount: null, authAT: undefined }));
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
            set(() => ({ authAccount: resp.customer }));
            return true;
          }
          showToast("订阅失败");
          return false;
        } catch (error) {
          console.error("purchase failed: ", error);
          showToast(error?.message);
        }
      },

      isAuthorized() {
        get().fetch();

        // has token or has code or disabled access control
        return (
          !!get().token ||
          !!get().accessCode ||
          !!get().authAT ||
          !get().enabledAccessControl()
        );
      },
      fetch() {
        if (fetchState > 0) return;
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

            if (!res.enableGPT4) {
              ALL_MODELS.forEach((model) => {
                if (model.name.startsWith("gpt-4")) {
                  (model as any).available = false;
                }
              });
            }

            if ((res as any).botHello) {
              BOT_HELLO.content = (res as any).botHello;
            }
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
        get().fetch();
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

        const info = sdk.getUserInfo();
        const tokens = await sdk?.getTokens();
        if (info && tokens) {
          set(() => ({
            authAccount: info || null,
            authAT: tokens?.accessToken,
          }));
        }
        return;
      },
    }),
    {
      name: StoreKey.Access,
      version: 1,
    },
  ),
);
