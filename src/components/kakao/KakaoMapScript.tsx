"use client";

import Script from "next/script";

export default function KakaoMapScript() {
  const KAKAO_MAP_API_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY;

  return (
    <Script
      src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_API_KEY}&libraries=services&autoload=false`}
      strategy="beforeInteractive"
    />
  );
}
