"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

type Route = Database["public"]["Tables"]["routes"]["Row"];
type Place = Database["public"]["Tables"]["places"]["Row"];
type PlaceDescription =
  Database["public"]["Tables"]["place_descriptions"]["Row"];
type Admin = Database["public"]["Tables"]["admins"]["Row"];

interface PlaceWithDescription extends Place {
  description?: PlaceDescription;
}

interface RouteWithCreator extends Route {
  creator?: Admin;
}

export default function RouteViewPage() {
  const params = useParams();
  const router = useRouter();
  const routeId = params.id as string;
  const mapRef = useRef<HTMLDivElement>(null);
  const kakaoMapRef = useRef<any>(null);

  const [route, setRoute] = useState<RouteWithCreator | null>(null);
  const [places, setPlaces] = useState<PlaceWithDescription[]>([]);
  const [selectedPlace, setSelectedPlace] =
    useState<PlaceWithDescription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRouteData();
  }, [routeId]);

  useEffect(() => {
    if (places.length > 0 && typeof window !== "undefined" && window.kakao) {
      initializeMap();
    }
  }, [places]);

  const loadRouteData = async () => {
    try {
      // Load route
      const { data: routeData, error: routeError } = await supabase
        .from("routes")
        .select("*")
        .eq("id", routeId)
        .eq("is_public", true)
        .single();

      if (routeError) throw routeError;

      const route = routeData as Route | null;
      if (!route) throw new Error("Route not found");

      // Load creator
      const { data: creatorData } = await supabase
        .from("admins")
        .select("*")
        .eq("id", route.creator_id)
        .single();

      setRoute({
        ...route,
        creator: (creatorData || undefined) as Admin | undefined,
      });

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
        setSelectedPlace(placesWithDescriptions[0]);
      }
    } catch (err: any) {
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = () => {
    if (!mapRef.current || !window.kakao || places.length === 0) return;

    window.kakao.maps.load(() => {
      const container = mapRef.current;
      const options = {
        center: new window.kakao.maps.LatLng(
          places[0].latitude,
          places[0].longitude,
        ),
        level: 5,
        draggable: true, // Enable map panning with mouse/touch
        scrollwheel: true, // Enable zoom with mouse wheel
      };

      const map = new window.kakao.maps.Map(container, options);
      kakaoMapRef.current = map;

      const bounds = new window.kakao.maps.LatLngBounds();

      // Add markers and polyline
      const linePath: any[] = [];

      places.forEach((place, index) => {
        const position = new window.kakao.maps.LatLng(
          place.latitude,
          place.longitude,
        );

        // Marker
        const marker = new window.kakao.maps.Marker({
          position,
          map,
        });

        // Custom overlay (number label)
        const content = `
          <div style="
            background: #4F46E5;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          ">
            ${index + 1}
          </div>
        `;

        const customOverlay = new window.kakao.maps.CustomOverlay({
          position,
          content,
          yAnchor: 2.5,
        });

        customOverlay.setMap(map);

        linePath.push(position);
        bounds.extend(position);

        // Click event
        window.kakao.maps.event.addListener(marker, "click", () => {
          setSelectedPlace(place);
          map.setCenter(position);
        });
      });

      // Draw polyline
      const polyline = new window.kakao.maps.Polyline({
        path: linePath,
        strokeWeight: 4,
        strokeColor: "#4F46E5",
        strokeOpacity: 0.8,
        strokeStyle: "solid",
      });

      polyline.setMap(map);

      // Fit bounds
      map.setBounds(bounds);
    });
  };

  const handlePlaceClick = (place: PlaceWithDescription) => {
    setSelectedPlace(place);

    if (kakaoMapRef.current) {
      const position = new window.kakao.maps.LatLng(
        place.latitude,
        place.longitude,
      );
      kakaoMapRef.current.setCenter(position);
      kakaoMapRef.current.setLevel(3);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">동선을 찾을 수 없습니다.</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.push("/")}
            className="text-indigo-600 hover:text-indigo-700 mb-2 flex items-center gap-2 text-sm"
          >
            <svg
              className="w-4 h-4"
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
            홈으로
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-gray-800">{route.title}</h1>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
              {route.today_type}
            </span>
          </div>
          {route.description && (
            <p className="text-gray-600 mt-2">{route.description}</p>
          )}
          {route.creator && (
            <div className="flex items-center gap-2 mt-4">
              {route.creator.profile_image_url && (
                <img
                  src={route.creator.profile_image_url}
                  alt={route.creator.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              <div className="text-sm">
                <span className="text-gray-600">큐레이터: </span>
                <span className="font-semibold text-gray-800">
                  {route.creator.name}
                </span>
                {route.creator.instagram_id && (
                  <a
                    href={`https://instagram.com/${route.creator.instagram_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-indigo-600 hover:text-indigo-700"
                  >
                    @{route.creator.instagram_id}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Map */}
          <div
            className="bg-white rounded-lg shadow-lg overflow-hidden"
            style={{ height: "600px" }}
          >
            <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
          </div>

          {/* Places List & Details */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-4 bg-indigo-600 text-white">
                <h2 className="text-xl font-semibold">
                  경로 ({places.length}개 장소)
                </h2>
              </div>

              <div className="divide-y divide-gray-200 max-h-[250px] overflow-y-auto">
                {places.map((place, index) => (
                  <button
                    key={place.id}
                    onClick={() => handlePlaceClick(place)}
                    className={`w-full p-4 text-left transition-colors ${
                      selectedPlace?.id === place.id
                        ? "bg-indigo-50 border-l-4 border-indigo-600"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 truncate">
                          {place.place_name}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">
                          {place.address}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Place Details */}
            {selectedPlace && (
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                      {places.findIndex((p) => p.id === selectedPlace.id) + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-gray-800">
                        {selectedPlace.place_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {selectedPlace.address}
                      </p>
                    </div>
                  </div>

                  {selectedPlace.description && (
                    <div className="prose prose-sm max-w-none text-gray-900">
                      <div
                        dangerouslySetInnerHTML={{
                          __html:
                            typeof selectedPlace.description.content ===
                            "string"
                              ? selectedPlace.description.content
                              : JSON.stringify(
                                  selectedPlace.description.content,
                                ),
                        }}
                      />
                    </div>
                  )}

                  {!selectedPlace.description && (
                    <p className="text-gray-500 text-sm italic">
                      이 장소에 대한 설명이 아직 작성되지 않았습니다.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
