"use client";
import React, { useState, useEffect } from "react";
import api from "../../services/api";
import Carousel from "../../components/Carousel";
import CustomLoader from "../../components/CustomLoader";

const RecommendationsView = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const getRecommendations = async () => {
      if (!("geolocation" in navigator)) {
        setError("Geolocation is not supported by your browser.");
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await api.get("/halls/recommendations", {
              params: { latitude, longitude },
            });
            setVenues(response.data.data || []);
          } catch (err) {
            console.error("Error fetching recommendations:", err);
            setError("Could not fetch recommendations. Please try again later.");
          } finally {
            setLoading(false);
          }
        },
        () => {
          setError("Location permission denied. Please enable location services to see recommendations.");
          setLoading(false);
        }
      );
    };

    getRecommendations();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Recommended Venues</h2>
      {loading && (
        <div className="flex justify-center items-center h-64">
          <CustomLoader size={64} />
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      {!loading && !error && venues.length > 0 && <Carousel venues={venues} />}
      {!loading && !error && venues.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          <p>No recommendations found for your location at this time.</p>
        </div>
      )}
    </div>
  );
};

export default RecommendationsView;
