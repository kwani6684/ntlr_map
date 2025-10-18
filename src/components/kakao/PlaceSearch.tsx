"use client";

import { useState, useEffect, useRef } from "react";
import type { KakaoPlace } from "@/lib/kakao/types";

interface PlaceSearchProps {
  onPlaceSelect: (place: KakaoPlace) => void;
}

export default function PlaceSearch({ onPlaceSelect }: PlaceSearchProps) {
  const [keyword, setKeyword] = useState("");
  const [places, setPlaces] = useState<KakaoPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const kakaoMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    // Initialize Kakao Map
    const initMap = () => {
      if (window.kakao && window.kakao.maps && mapRef.current) {
        window.kakao.maps.load(() => {
          const container = mapRef.current;
          const options = {
            center: new window.kakao.maps.LatLng(37.5665, 126.978), // Seoul
            level: 3,
          };
          kakaoMapRef.current = new window.kakao.maps.Map(container, options);
        });
      }
    };

    if (typeof window !== "undefined") {
      if (window.kakao && window.kakao.maps) {
        initMap();
      } else {
        // Wait for Kakao Maps to load
        const checkKakao = setInterval(() => {
          if (window.kakao && window.kakao.maps) {
            clearInterval(checkKakao);
            initMap();
          }
        }, 100);

        return () => clearInterval(checkKakao);
      }
    }
  }, []);

  const searchPlaces = () => {
    if (!keyword.trim()) {
      alert("검색어를 입력해주세요.");
      return;
    }

    if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
      alert("카카오맵이 로드되지 않았습니다. 페이지를 새로고침해주세요.");
      return;
    }

    setLoading(true);

    try {
      const ps = new window.kakao.maps.services.Places();

      ps.keywordSearch(keyword, (data: KakaoPlace[], status: any) => {
        if (status === window.kakao.maps.services.Status.OK) {
          setPlaces(data);
          displayPlacesOnMap(data);
        } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
          setPlaces([]);
          alert("검색 결과가 없습니다.");
        } else {
          setPlaces([]);
          alert("검색 중 오류가 발생했습니다.");
        }
        setLoading(false);
      });
    } catch (error) {
      console.error("Search error:", error);
      alert("검색 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  const displayPlacesOnMap = (places: KakaoPlace[]) => {
    if (!kakaoMapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    const bounds = new window.kakao.maps.LatLngBounds();

    places.forEach((place) => {
      const position = new window.kakao.maps.LatLng(
        Number(place.y),
        Number(place.x),
      );

      const marker = new window.kakao.maps.Marker({
        position,
        map: kakaoMapRef.current,
      });

      markersRef.current.push(marker);
      bounds.extend(position);
    });

    if (places.length > 0) {
      kakaoMapRef.current.setBounds(bounds);
    }
  };

  const handlePlaceClick = (place: KakaoPlace) => {
    onPlaceSelect(place);

    // Move map to selected place
    if (kakaoMapRef.current) {
      const position = new window.kakao.maps.LatLng(
        Number(place.y),
        Number(place.x),
      );
      kakaoMapRef.current.setCenter(position);
      kakaoMapRef.current.setLevel(3);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      searchPlaces();
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="장소를 검색하세요 (예: 강남역 카페)"
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <button
          onClick={searchPlaces}
          disabled={loading}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
        >
          {loading ? "검색 중..." : "검색"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Search Results */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">
              검색 결과 {places.length > 0 && `(${places.length}개)`}
            </h3>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: "352px" }}>
            {places.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {keyword ? "검색 결과가 없습니다." : "장소를 검색하세요."}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {places.map((place, index) => (
                  <button
                    key={place.id}
                    onClick={() => handlePlaceClick(place)}
                    className="w-full p-4 text-left hover:bg-indigo-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-800 truncate">
                          {place.place_name}
                        </h4>
                        <p className="text-sm text-gray-600 truncate">
                          {place.road_address_name || place.address_name}
                        </p>
                        {place.category_name && (
                          <p className="text-xs text-gray-500 mt-1">
                            {place.category_name}
                          </p>
                        )}
                      </div>
                      <svg
                        className="w-5 h-5 text-indigo-600 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div
          className="bg-gray-100 rounded-lg overflow-hidden border border-gray-200"
          style={{ height: "400px" }}
        >
          <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
        </div>
      </div>
    </div>
  );
}
