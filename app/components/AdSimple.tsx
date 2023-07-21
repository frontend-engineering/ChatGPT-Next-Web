"use client";
import { useEffect, useState } from "react";
export default function AdSimple(...props: any) {
  const { currentPath } = props;
  const [hideAds, setHideAds] = useState(false);

  useEffect(() => {
    if (window.innerWidth <= 1280) {
      setHideAds(true);
    }
    (window as any).adsbygoogle = (window as any).adsbygoogle || [];
    (window as any).adsbygoogle.push({});
  }, [currentPath]);

  const closeAds = () => {
    setHideAds(true);
  };

  return hideAds ? null : (
    <div
      key={currentPath}
      style={{ position: "relative", width: "calc((100vw - 1224px))" }}
    >
      <div
        onClick={closeAds}
        style={{
          position: "absolute",
          top: "-20px",
          right: "20px",
          cursor: "pointer",
          boxShadow: "0 0 2px 1px #80808066",
          padding: "4px 6px",
          borderRadius: "4px",
        }}
      >
        关闭广告
      </div>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-3614870144525266"
        data-ad-slot="5597049526"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
}
