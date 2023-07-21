"use client";
import { useEffect } from "react";
export default function AdSimple(...props: any) {
  const { currentPath } = props;
  useEffect(() => {
    (window as any).adsbygoogle = (window as any).adsbygoogle || [];
    (window as any).adsbygoogle.push({});
  }, [currentPath]);

  return (
    <div key={currentPath} style={{ width: "calc((100vw - 1224px))" }}>
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
