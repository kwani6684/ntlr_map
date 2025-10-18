"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import AdminGuard from "@/components/admin/AdminGuard";
import TiptapEditor from "@/components/editor/TiptapEditor";
import type { Database } from "@/lib/supabase/database.types";

type Route = Database["public"]["Tables"]["routes"]["Row"];
type Place = Database["public"]["Tables"]["places"]["Row"];
type PlaceDescription =
  Database["public"]["Tables"]["place_descriptions"]["Row"];

interface PlaceWithDescription extends Place {
  description?: PlaceDescription;
}

function EditRouteForm() {
  const params = useParams();
  const router = useRouter();
  const routeId = params.id as string;

  const [route, setRoute] = useState<Route | null>(null);
  const [todayType, setTodayType] = useState<"다른하루" | "낯선하루">("다른하루");
  const [places, setPlaces] = useState<PlaceWithDescription[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingRoute, setSavingRoute] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadRouteData();
  }, [routeId]);

  useEffect(() => {
    if (selectedPlaceId) {
      const place = places.find((p) => p.id === selectedPlaceId);
      if (place?.description) {
        setEditorContent(
          typeof place.description.content === "string"
            ? place.description.content
            : JSON.stringify(place.description.content),
        );
      } else {
        setEditorContent("");
      }
    }
  }, [selectedPlaceId, places]);

  const loadRouteData = async () => {
    try {
      // Load route
      const { data: routeData, error: routeError } = await supabase
        .from("routes")
        .select("*")
        .eq("id", routeId)
        .single();

      if (routeError) throw routeError;

      const route = routeData as Route;
      setRoute(route);
      setTodayType(route.today_type);

      // Load places
      const { data: placesData, error: placesError } = await supabase
        .from("places")
        .select("*")
        .eq("route_id", routeId)
        .order("order_index", { ascending: true });

      if (placesError) throw placesError;

      const places = (placesData || []) as Place[];

      // Load descriptions
      const placeIds = places.map((p) => p.id);
      const { data: descriptionsData } = await supabase
        .from("place_descriptions")
        .select("*")
        .in("place_id", placeIds);

      const descriptions = (descriptionsData || []) as PlaceDescription[];

      const placesWithDescriptions = places.map((place) => ({
        ...place,
        description: descriptions.find((d) => d.place_id === place.id),
      }));

      setPlaces(placesWithDescriptions);

      if (placesWithDescriptions.length > 0) {
        setSelectedPlaceId(placesWithDescriptions[0].id);
      }
    } catch (err: any) {
      console.error("Load error:", err);
      setError("동선 정보를 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const saveRouteInfo = async () => {
    if (!route) return;

    setSavingRoute(true);
    setError("");

    try {
      type RouteUpdate = Database["public"]["Tables"]["routes"]["Update"];
      const updateData: RouteUpdate = { today_type: todayType };

      const { error: updateError } = await supabase
        .from("routes")
        .update(updateData as never)
        .eq("id", routeId);

      if (updateError) throw updateError;

      alert("동선 정보가 저장되었습니다!");
      await loadRouteData();
    } catch (err: any) {
      console.error("Save route error:", err);
      setError("동선 정보 저장 중 오류가 발생했습니다.");
    } finally {
      setSavingRoute(false);
    }
  };

  const saveDescription = async () => {
    if (!selectedPlaceId) return;

    setSaving(true);
    setError("");

    try {
      const place = places.find((p) => p.id === selectedPlaceId);

      type DescriptionUpdate =
        Database["public"]["Tables"]["place_descriptions"]["Update"];
      type DescriptionInsert =
        Database["public"]["Tables"]["place_descriptions"]["Insert"];

      if (place?.description) {
        // Update existing description
        const updateData: DescriptionUpdate = {
          content: editorContent as any,
          updated_at: new Date().toISOString(),
        };

        const { error: updateError } = await supabase
          .from("place_descriptions")
          .update(updateData as never)
          .eq("id", place.description.id);

        if (updateError) throw updateError;
      } else {
        // Create new description
        const insertData: DescriptionInsert = {
          place_id: selectedPlaceId,
          content: editorContent as any,
        };

        const { error: insertError } = await supabase
          .from("place_descriptions")
          .insert([insertData as never]);

        if (insertError) throw insertError;
      }

      // Reload data
      await loadRouteData();
      alert("저장되었습니다!");
    } catch (err: any) {
      console.error("Save error:", err);
      setError("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">동선을 찾을 수 없습니다.</p>
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const selectedPlace = places.find((p) => p.id === selectedPlaceId);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <div className="mb-6">
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="text-indigo-600 hover:text-indigo-700 mb-2 flex items-center gap-2"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              대시보드로 돌아가기
            </button>
            <h1 className="text-3xl font-bold text-gray-800">{route.title}</h1>
            {route.description && (
              <p className="text-gray-600 mt-2">{route.description}</p>
            )}
          </div>

          {/* Route Info Section */}
          <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              동선 기본 정보
            </h2>
            <div className="space-y-4">
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

              <button
                onClick={saveRouteInfo}
                disabled={savingRoute}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
              >
                {savingRoute ? "저장 중..." : "동선 정보 저장"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Places List */}
            <div className="lg:col-span-1">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                장소 목록 ({places.length}개)
              </h2>
              <div className="space-y-2">
                {places.map((place, index) => (
                  <button
                    key={place.id}
                    onClick={() => setSelectedPlaceId(place.id)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      selectedPlaceId === place.id
                        ? "border-indigo-600 bg-indigo-50"
                        : "border-gray-200 hover:border-indigo-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 truncate">
                          {place.place_name}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">
                          {place.address}
                        </p>
                        {place.description && (
                          <p className="text-xs text-green-600 mt-1">
                            ✓ 설명 작성됨
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Editor */}
            <div className="lg:col-span-2">
              {selectedPlace ? (
                <div>
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">
                      {selectedPlace.place_name}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {selectedPlace.address}
                    </p>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      장소 설명
                    </label>
                    <TiptapEditor
                      content={editorContent}
                      onChange={setEditorContent}
                      placeholder="이 장소에 대한 설명을 작성하세요..."
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={saveDescription}
                    disabled={saving}
                    className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
                  >
                    {saving ? "저장 중..." : "설명 저장"}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  장소를 선택하여 설명을 추가하세요
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditRoutePage() {
  return (
    <AdminGuard>
      <EditRouteForm />
    </AdminGuard>
  );
}
