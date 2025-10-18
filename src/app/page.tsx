"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import ThemeToggle from "@/components/ThemeToggle";

type Route = Database["public"]["Tables"]["routes"]["Row"];
type Admin = Database["public"]["Tables"]["admins"]["Row"];

interface RouteWithCreator extends Route {
  creator?: Admin;
  place_count: number;
}

export default function Home() {
  const router = useRouter();
  const [routes, setRoutes] = useState<RouteWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<
    "전체" | "다른하루" | "낯선하루"
  >("전체");

  useEffect(() => {
    loadPublicRoutes();
  }, []);

  const loadPublicRoutes = async () => {
    try {
      const { data: routesData, error: routesError } = await supabase
        .from("routes")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (routesError) throw routesError;

      const routes = (routesData || []) as Route[];

      // Load creator info and place counts
      const routesWithDetails = await Promise.all(
        routes.map(async (route) => {
          const { data: creator } = await supabase
            .from("admins")
            .select("*")
            .eq("id", route.creator_id)
            .single();

          const { count } = await supabase
            .from("places")
            .select("*", { count: "exact", head: true })
            .eq("route_id", route.id);

          return {
            ...route,
            creator: (creator || undefined) as Admin | undefined,
            place_count: count || 0,
          };
        }),
      );

      setRoutes(routesWithDetails);
    } catch (err) {
      console.error("Load routes error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter routes based on selected type
  const filteredRoutes =
    filterType === "전체"
      ? routes
      : routes.filter((route) => route.today_type === filterType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950">
      {/* Hero Section */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-end mb-4">
            <ThemeToggle />
          </div>
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
              NTLR Map
            </h1>
          </div>
        </div>
      </header>

      {/* Routes Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            추천 동선
          </h2>
          {/* Filter Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType("전체")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterType === "전체"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setFilterType("다른하루")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterType === "다른하루"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
              }`}
            >
              다른하루
            </button>
            <button
              onClick={() => setFilterType("낯선하루")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterType === "낯선하루"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
              }`}
            >
              낯선하루
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredRoutes.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
            <svg
              className="w-20 h-20 text-gray-400 dark:text-gray-500 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
              아직 등록된 동선이 없습니다.
            </p>
            <p className="text-gray-500 dark:text-gray-400">
              첫 번째 동선을 만들어보세요!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRoutes.map((route) => (
              <button
                key={route.id}
                onClick={() => router.push(`/routes/${route.id}`)}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden text-left group border border-transparent dark:border-gray-700"
              >
                {/* Card Header with Gradient */}
                <div className="h-32 bg-gradient-to-br from-indigo-500 to-purple-600 relative">
                  <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"></div>
                  {/* Today Type Badge */}
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 bg-white/95 backdrop-blur-sm rounded-full text-sm font-semibold text-indigo-600 shadow-md">
                      {route.today_type}
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-bold text-white truncate">
                      {route.title}
                    </h3>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  {route.description && (
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                      {route.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <div className="flex items-center gap-1">
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
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {route.place_count}개 장소
                    </div>
                  </div>

                  {route.creator && (
                    <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                      {route.creator.profile_image_url ? (
                        <img
                          src={route.creator.profile_image_url}
                          alt={route.creator.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        </div>
                      )}
                      <div className="text-sm">
                        <p className="font-medium text-gray-800 dark:text-gray-200">
                          {route.creator.name}
                        </p>
                        {route.creator.instagram_id && (
                          <p className="text-gray-500 dark:text-gray-400 text-xs">
                            @{route.creator.instagram_id}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* View Button */}
                <div className="px-6 pb-6">
                  <div className="w-full py-2 text-center bg-indigo-50 dark:bg-indigo-900/30 group-hover:bg-indigo-600 text-indigo-600 dark:text-indigo-400 group-hover:text-white font-medium rounded-lg transition-colors">
                    동선 보기 →
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-600 dark:text-gray-400">
            © 2025 NTLR Map. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
