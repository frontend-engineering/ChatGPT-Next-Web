import styles from "./auth.module.scss";
import { IconButton } from "./button";

import { useNavigate } from "react-router-dom";
import { Path } from "../constant";
import { useAccessStore } from "../store";
import Locale from "../locales";

import BotIcon from "../icons/bot.svg";
import SettingsIcon from "../icons/settings.svg";
import Recharge from "../icons/recharge.svg";
import { useEffect } from "react";
import { getClientConfig } from "../config/client";

export function AuthPage() {
  const navigate = useNavigate();
  const accessStore = useAccessStore();

  const goHome = () => navigate(Path.Home);
  const goChat = () => navigate(Path.Chat);
  const resetAccessCode = () => {
    accessStore.update((access) => {
      access.openaiApiKey = "";
      access.accessCode = "";
    });
  }; // Reset access code to empty string

  useEffect(() => {
    if (getClientConfig()?.isApp) {
      navigate(Path.Settings);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles["auth-page"]}>
      <div className={`no-dark ${styles["auth-logo"]}`}>
        <BotIcon />
      </div>

      <div className={styles["auth-title"]}>{Locale.Auth.LoginTitle}</div>
      <div className={styles["auth-tips"]}>{Locale.Auth.LoginTips}</div>

      <div className={styles["account-manager"]}>
        {accessStore.authAccount ? (
          <>
            <span className={styles["account-amount"]}>
              {accessStore.authAccount?.name
                ? `${accessStore.authAccount?.name} - `
                : ""}
              {Locale.Settings.Account.Amount}:{" "}
              {accessStore.authAccount.profile?.amount || "-"}
            </span>
            {(accessStore.authAccount.profile?.amount || 0) > 0 ? null : (
              <IconButton
                icon={<Recharge />}
                onClick={accessStore.purchase}
                className={"password-eye"}
                text={Locale.Settings.Account.Recharge}
              />
            )}
            <IconButton
              type="danger"
              icon={<SettingsIcon />}
              onClick={accessStore.logout}
              className={"password-eye"}
              text={Locale.Settings.Account.LogoutBtn}
            />
          </>
        ) : (
          <IconButton
            icon={<SettingsIcon />}
            type="primary"
            onClick={accessStore.login}
            className={"password-eye"}
            text={Locale.Settings.Account.Placeholder}
          />
        )}
      </div>
      {/* 
      <div className={styles["auth-divider"]}>OR</div>

      <div className={styles["auth-title"]}>{Locale.Auth.Title}</div>
      <div className={styles["auth-tips"]}>{Locale.Auth.Tips}</div>
      <input
        className={styles["auth-input"]}
        type="password"
        placeholder={Locale.Auth.Input}
        value={accessStore.accessCode}
        onChange={(e) => {
          accessStore.update(
            (access) => (access.accessCode = e.currentTarget.value),
          );
        }}
      /> */}
      {!accessStore.hideUserApiKey ? (
        <>
          <div className={styles["auth-tips"]}>{Locale.Auth.SubTips}</div>
          <input
            className={styles["auth-input"]}
            type="password"
            placeholder={Locale.Settings.Access.OpenAI.ApiKey.Placeholder}
            value={accessStore.openaiApiKey}
            onChange={(e) => {
              accessStore.update(
                (access) => (access.openaiApiKey = e.currentTarget.value),
              );
            }}
          />
          <input
            className={styles["auth-input"]}
            type="password"
            placeholder={Locale.Settings.Access.Google.ApiKey.Placeholder}
            value={accessStore.googleApiKey}
            onChange={(e) => {
              accessStore.update(
                (access) => (access.googleApiKey = e.currentTarget.value),
              );
            }}
          />
        </>
      ) : null}

      <div className={styles["auth-actions"]}>
        <IconButton
          text={Locale.Auth.Confirm}
          type="primary"
          onClick={goChat}
        />
        <IconButton
          text={Locale.Auth.Later}
          onClick={() => {
            resetAccessCode();
            goHome();
          }}
        />
      </div>
    </div>
  );
}
