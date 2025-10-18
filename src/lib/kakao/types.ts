export interface KakaoPlace {
  id: string;
  place_name: string;
  address_name: string;
  road_address_name: string;
  x: string; // longitude
  y: string; // latitude
  category_name?: string;
  phone?: string;
  place_url?: string;
}

export interface SelectedPlace {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  kakaoPlaceId: string;
  orderIndex: number;
}

declare global {
  interface Window {
    kakao: any;
  }
}
