import { useEffect, memo } from "react";
import styles from "./home.module.scss";
import { isMobile } from "../utils";

export const AdFeed = memo(
  function AdComponent(props: { idx: string; size?: number }) {
    console.log("ad feed idx: ", props);
    const { idx } = props;
    const mobile = isMobile();

    useEffect(() => {
      setTimeout(() => {
        (window as any).adsbygoogle = (window as any).adsbygoogle || [];
        (window as any).adsbygoogle.push({});
      }, 300);
    }, [props.idx]);
    return (
      <div
        className={styles["chat-message"]}
        style={{ minHeight: "300px", width: "100%", minWidth: "250px" }}
        id={`feeds-${idx}`}
        key={`feeds-${idx}`}
      >
        <ins
          className="adsbygoogle"
          style={{ display: "block", width: "100%" }}
          data-ad-format="fluid"
          data-ad-layout-key={mobile ? "-cb-y+66+9b-138" : "-fb+5w+4e-db+86"}
          data-ad-client="ca-pub-3614870144525266"
          data-ad-slot={mobile ? "8944040232" : "9759655819"}
        ></ins>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.idx === nextProps.idx; // don't re-render if key is the same
  },
);
