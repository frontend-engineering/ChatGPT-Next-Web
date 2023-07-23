import { useEffect, memo } from "react";
import styles from "./home.module.scss";

export const AdFeed = memo(
  function AdComponent(props: { idx: string; size?: number }) {
    console.log("ad feed idx: ", props);
    const { idx } = props;
    useEffect(() => {
      (window as any).adsbygoogle = (window as any).adsbygoogle || [];
      (window as any).adsbygoogle.push({});
    }, [props.idx]);
    return (
      <div
        className={styles["chat-message"]}
        style={{ minHeight: "300px" }}
        id={`feeds-${idx}`}
        key={`feeds-${idx}`}
      >
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-format="fluid"
          data-ad-layout-key="-fb+5w+4e-db+86"
          data-ad-client="ca-pub-3614870144525266"
          data-ad-slot="9759655819"
        ></ins>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.idx === nextProps.idx; // don't re-render if key is the same
  },
);
