import styles from "./auth.module.scss";
import { IconButton } from "./button";

import { useNavigate } from "react-router-dom";
import { Path } from "../constant";
import { useAccessStore } from "../store";
import Locale from "../locales";

import BotIcon from "../icons/bot.svg";
import SettingsIcon from "../icons/settings.svg";
import Recharge from "../icons/recharge.svg";

export function AuthPage() {
  const navigate = useNavigate();
  const access = useAccessStore();

  const goHome = () => navigate(Path.Home);

  return (
    <div className={styles["auth-page"]}>
      <div className={`no-dark ${styles["auth-logo"]}`}>
        <BotIcon />
      </div>

      <div className={styles["auth-title"]}>{Locale.Auth.LoginTitle}</div>
      <div className={styles["auth-tips"]}>{Locale.Auth.LoginTips}</div>

      <div className={styles["account-manager"]}>
        {access.authAccount ? (
          <>
            <span className={styles["account-amount"]}>
              {access.authAccount?.name ? `${access.authAccount?.name} - ` : ""}
              {Locale.Settings.Account.Amount}:{" "}
              {access.authAccount.profile?.amount || "-"}
            </span>
            {(access.authAccount.profile?.amount || 0) > 0 ? null : (
              <IconButton
                icon={<Recharge />}
                onClick={access.purchase}
                className={"password-eye"}
                text={Locale.Settings.Account.Recharge}
              />
            )}
            <IconButton
              type="danger"
              icon={<SettingsIcon />}
              onClick={access.logout}
              className={"password-eye"}
              text={Locale.Settings.Account.LogoutBtn}
            />
          </>
        ) : (
          <IconButton
            icon={<SettingsIcon />}
            type="primary"
            onClick={access.login}
            className={"password-eye"}
            text={Locale.Settings.Account.Placeholder}
          />
        )}
      </div>

      <div className={styles["auth-divider"]}>OR</div>

      <div className={styles["auth-title"]}>{Locale.Auth.Title}</div>
      <div className={styles["auth-tips"]}>{Locale.Auth.Tips}</div>
      <input
        className={styles["auth-input"]}
        type="password"
        placeholder={Locale.Auth.Input}
        value={access.accessCode}
        onChange={(e) => {
          access.updateCode(e.currentTarget.value);
        }}
      />
      <div className={styles["auth-actions"]}>
        <IconButton
          text={Locale.Auth.Confirm}
          type="primary"
          onClick={goHome}
        />
        <IconButton text={Locale.Auth.Later} onClick={goHome} />
      </div>
    </div>
  );
}
