"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth-store";
import AdminGuard from "@/components/admin/AdminGuard";
import PlaceSearch from "@/components/kakao/PlaceSearch";
import type { KakaoPlace, SelectedPlace } from "@/lib/kakao/types";
import type { Database } from "@/lib/supabase/database.types";

function CreateRouteForm() {
  const router = useRouter();
  const admin = useAuthStore((state) => state.admin);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [todayType, setTodayType] = useState<"다른하루" | "낯선하루">("다른하루");
  const [selectedPlaces, setSelectedPlaces] = useState<SelectedPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePlaceSelect = (place: KakaoPlace) => {
    // Check if place is already selected
    if (selectedPlaces.some((p) => p.kakaoPlaceId === place.id)) {
      alert("이미 추가된 장소입니다.");
      return;
    }

    const newPlace: SelectedPlace = {
      id: Math.random().toString(36).substring(7),
      name: place.place_name,
      address: place.road_address_name || place.address_name,
      latitude: Number(place.y),
      longitude: Number(place.x),
      kakaoPlaceId: place.id,
      orderIndex: selectedPlaces.length,
    };

    setSelectedPlaces([...selectedPlaces, newPlace]);
  };

  const removePlace = (placeId: string) => {
    const updatedPlaces = selectedPlaces
      .filter((p) => p.id !== placeId)
      .map((p, index) => ({ ...p, orderIndex: index }));
    setSelectedPlaces(updatedPlaces);
  };

  const movePlaceUp = (index: number) => {
    if (index === 0) return;

    const updatedPlaces = [...selectedPlaces];
    [updatedPlaces[index - 1], updatedPlaces[index]] = [
      updatedPlaces[index],
      updatedPlaces[index - 1],
    ];

    const reindexed = updatedPlaces.map((p, i) => ({ ...p, orderIndex: i }));
    setSelectedPlaces(reindexed);
  };

  const movePlaceDown = (index: number) => {
    if (index === selectedPlaces.length - 1) return;

    const updatedPlaces = [...selectedPlaces];
    [updatedPlaces[index], updatedPlaces[index + 1]] = [
      updatedPlaces[index + 1],
      updatedPlaces[index],
    ];

    const reindexed = updatedPlaces.map((p, i) => ({ ...p, orderIndex: i }));
    setSelectedPlaces(reindexed);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!admin) {
      setError("로그인이 필요합니다.");
      return;
    }

    if (selectedPlaces.length === 0) {
      setError("최소 1개 이상의 장소를 추가해주세요.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      type RouteInsert = Database["public"]["Tables"]["routes"]["Insert"];

      // Create route
      const routeData: RouteInsert = {
        title,
        description: description || null,
        creator_id: admin.id,
        is_public: true,
        today_type: todayType,
      };

      const { data: newRouteData, error: routeError } = await supabase
        .from("routes")
        .insert([routeData] as any)
        .select()
        .single();

      if (routeError) throw routeError;

      type RouteRow = Database["public"]["Tables"]["routes"]["Row"];
      const route = newRouteData as RouteRow;

      type PlaceInsert = Database["public"]["Tables"]["places"]["Insert"];

      // Create places
      const placesData: PlaceInsert[] = selectedPlaces.map((place) => ({
        route_id: route.id,
        place_name: place.name,
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
        kakao_place_id: place.kakaoPlaceId,
        order_index: place.orderIndex,
      }));

      const { error: placesError } = await supabase
        .from("places")
        .insert(placesData as any);

      if (placesError) throw placesError;

      router.push(`/admin/routes/${route.id}/edit`);
    } catch (err: any) {
      console.error("Route creation error:", err);
      setError(err.message || "동선 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            새 동선 만들기
          </h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Route Basic Info */}
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  동선 제목 <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="예: 강남 핫플레이스 투어"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  동선 설명
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  placeholder="동선에 대한 간단한 설명을 입력하세요"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  하루 타입 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="다른하루"
                      checked={todayType === "다른하루"}
                      onChange={(e) =>
                        setTodayType(e.target.value as "다른하루")
                      }
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-gray-900 font-medium">다른하루</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="낯선하루"
                      checked={todayType === "낯선하루"}
                      onChange={(e) =>
                        setTodayType(e.target.value as "낯선하루")
                      }
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-gray-900 font-medium">낯선하루</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Place Search */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                장소 검색 및 추가
              </h2>
              <PlaceSearch onPlaceSelect={handlePlaceSelect} />
            </div>

            {/* Selected Places */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                선택된 장소 ({selectedPlaces.length}개)
              </h2>

              {selectedPlaces.length === 0 ? (
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
                  위에서 장소를 검색하고 추가해주세요
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedPlaces.map((place, index) => (
                    <div
                      key={place.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4 hover:border-indigo-300 transition-colors"
                    >
                      {/* Order Number */}
                      <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                        {index + 1}
                      </div>

                      {/* Place Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 truncate">
                          {place.name}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">
                          {place.address}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => movePlaceUp(index)}
                          disabled={index === 0}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-30"
                          title="위로"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 15l7-7 7 7"
                            />
                          </svg>
                        </button>

                        <button
                          type="button"
                          onClick={() => movePlaceDown(index)}
                          disabled={index === selectedPlaces.length - 1}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-30"
                          title="아래로"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>

                        <button
                          type="button"
                          onClick={() => removePlace(place.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="삭제"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading || selectedPlaces.length === 0}
                className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
              >
                {loading ? "생성 중..." : "동선 생성하기"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function CreateRoutePage() {
  return (
    <AdminGuard>
      <CreateRouteForm />
    </AdminGuard>
  );
}
