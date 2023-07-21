"use client";
import { useEffect, useState } from "react";
import styles from "./home.module.scss";

export default function AdFeed(props: any) {
  const { currentPath, idx } = props;

  useEffect(() => {
    if (!(window as any).adsbygoogle) {
      (window as any).adsbygoogle = (window as any).adsbygoogle || [];
      (window as any).adsbygoogle.push({});
    }
  }, [currentPath]);

  return (
    <div
      className={styles["chat-message"]}
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
}
