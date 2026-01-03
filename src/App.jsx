import React, { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { moodOptions } from './moodConfig';
import { GoogleGenerativeAI } from "@google/generative-ai";


// Initialize Gemini
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export default function App() {
  const [userLocation, setUserLocation] = useState({ lat: 12.9716, lng: 77.5946 }); // Default Bangalore
  const [places, setPlaces] = useState([]);
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // --- Typewriter State ---
  const [placeholder, setPlaceholder] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- AI Vibe State ---
const [aiVibe, setAiVibe] = useState(null);
const [isVibeLoading, setIsVibeLoading] = useState(false);


  const phrases = [
    "Find a quiet cafe to work...",
    "Spicy ramen nearby...",
    "Cozy park for a sunset walk...",
    "Hidden gems with live music...",
    "Best pizza for a date night..."
  ];

  const banned = /(fuck|shit|kill|hate)/i;



  // Typewriter Logic
  useEffect(() => {
    const currentPhrase = phrases[phraseIndex];
    const timeout = setTimeout(() => {
      if (!isDeleting && charIndex < currentPhrase.length) {
        setPlaceholder(currentPhrase.substring(0, charIndex + 1));
        setCharIndex(prev => prev + 1);
      } else if (isDeleting && charIndex > 0) {
        setPlaceholder(currentPhrase.substring(0, charIndex - 1));
        setCharIndex(prev => prev - 1);
      } else if (!isDeleting && charIndex === currentPhrase.length) {
        setTimeout(() => setIsDeleting(true), 1500);
      } else {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
        setCharIndex(0);
      }
    }, isDeleting ? 50 : 100);
    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, phraseIndex]);

 // AI Search Handler
  const handleAISearch = async (userInput) => {
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `User request: "${userInput}". 
    Provide a Google Maps search configuration.
    Return ONLY a JSON object with these keys:
    "type": (one valid primary type like 'cafe', 'restaurant', 'park'),
    "keyword": (one vibe term like 'quiet', 'spicy', 'cozy'),
    "moodLabel": (a short emoji label).`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const cleanJsonText = text.replace(/```json|```/g, "").trim();
      const cleanJson = JSON.parse(cleanJsonText);
      fetchPlaces(null, cleanJson);
    } catch (error) {
      console.error("AI Search Error:", error);
    } finally {
      setIsAiLoading(false);
    }
  };
  // --- AI Vibe Analysis (Gemini NLP) ---
  const generateAIVibe = async (place) => {
    setIsVibeLoading(true);
    setAiVibe(null);

    try {
      const textForAnalysis =
        place.summary ||
        `This place is called ${place.name}. It has a rating of ${place.rating || "unknown"}.`;

      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `
Analyze the following place description and infer the vibe.

Return ONLY valid JSON in this format:
{
  "cozy": number (0-100),
  "loud": number (0-100),
  "workFriendly": number (0-100),
  "summary": string (1 short sentence)
}

Text:
"""
${textForAnalysis}
"""
`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const clean = responseText.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      setAiVibe(parsed);
    } catch (err) {
      console.error("AI Vibe Error:", err);
      setAiVibe({
        cozy: 50,
        loud: 50,
        workFriendly: 50,
        summary: "AI could not determine the vibe."
      });
    } finally {
      setIsVibeLoading(false);
    }
  };

  // Get User Location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        () => console.log("Location access denied.")
      );
    }
  }, []);

  // Fetch Logic
  const fetchPlaces = async (moodKey, aiConfig = null) => {
    if (!window.google) return;
    let type, label;

    if (aiConfig) {
      type = aiConfig.type;
      label = aiConfig.moodLabel;
      setSelectedMood(label);
    } else {
      const config = moodOptions[moodKey];
      type = config.type;
      label = config.label;
      setSelectedMood(moodKey);
    }

    const { Place, SearchNearbyRankPreference } = await window.google.maps.importLibrary("places");
    const request = {
      fields: ["id", "displayName", "location", "rating", "userRatingCount", "photos", "editorialSummary"],
      locationRestriction: {
        center: new window.google.maps.LatLng(userLocation.lat, userLocation.lng),
        radius: 3000,
      },
      includedPrimaryTypes: [type],
      maxResultCount: 15,
      rankPreference: SearchNearbyRankPreference.DISTANCE
    };

    try {
      const { places: results } = await Place.searchNearby(request);
      if (results && results.length > 0) {
        const smartResults = results.map(place => {
          const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
            new window.google.maps.LatLng(userLocation.lat, userLocation.lng),
            place.location
          );
          return {
            place_id: place.id,
            name: place.displayName,
            location: place.location,
            rating: place.rating,
            user_ratings_total: place.userRatingCount,
            photo: place.photos?.[0]?.getURI({ maxWidth: 400, maxHeight: 300 }),
            summary: place.editorialSummary,
            distanceText: `${Math.round(distance)}m`
          };
        });
        setPlaces(smartResults);
      } else {
        setPlaces([]);
      }
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} libraries={['places', 'geometry']}>
      <div style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: 'sans-serif', position: 'relative', backgroundColor: '#fff' }}>
        
        {/* SIDEBAR */}
        <div style={{ width: '350px', overflowY: 'auto', padding: '20px', backgroundColor: '#f8f9fa', borderRight: '1px solid #ddd', zIndex: 2 }}>
          <div style={{ marginBottom: '25px' }}>
            <h2 style={{ 
              background: 'linear-gradient(to right, #ff00cc, #3333ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: '0 0 15px 0', 
              fontSize: '26px',
              fontWeight: '100' 
            }}>
              AI Recommender
            </h2>
            <input 
              type="text" 
              placeholder={isAiLoading ? "Gemini is thinking..." : placeholder}
              disabled={isAiLoading}
              onKeyDown={(e) => e.key === 'Enter' && handleAISearch(e.target.value)}
              style={{ 
                width: '100%', padding: '14px 20px', borderRadius: '15px', 
                border: '2px solid transparent',
                background: 'linear-gradient(white, white) padding-box, linear-gradient(to right, #ff00cc, #3333ff, #00d4ff) border-box',
                outline: 'none', color: '#333', backgroundColor: isAiLoading ? '#f0f0f0' : '#fff',
                boxSizing: 'border-box', fontSize: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease'
              }}
            />
            
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {Object.keys(moodOptions).map(key => (
              <button 
                key={key} 
                onClick={() => fetchPlaces(key)} 
                style={{ 
                  padding: '8px 15px', borderRadius: '20px', border: '1px solid #ddd',
                  backgroundColor: selectedMood === key ? '#3333ff' : '#fff',
                  color: selectedMood === key ? '#fff' : '#333',
                  cursor: 'pointer', fontWeight: 'bold'
                }}
              >
                {moodOptions[key].label}
              </button>
            ))}
          </div>

          {places.length === 0 && !isAiLoading && <p style={{ color: '#666' }}>Type a vibe like "quiet cafe" above!</p>}

          {places.map(place => (
            <div 
              key={place.place_id} 
              onClick={() => {
  setSelectedPlace(place);
  generateAIVibe(place);
}}
              style={{ 
                padding: '12px', marginBottom: '10px', borderRadius: '10px', display: 'flex', gap: '10px',
                backgroundColor: selectedPlace?.place_id === place.place_id ? '#e7f1ff' : '#fff',
                border: selectedPlace?.place_id === place.place_id ? '2px solid #3333ff' : '1px solid #eee',
                cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
              }}
            >
              {place.photo ? (
                <img src={place.photo} style={{ width: '60px', height: '60px', borderRadius: '6px', objectFit: 'cover' }} alt={place.name} />
              ) : (
                <div style={{ width: '60px', height: '60px', borderRadius: '6px', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '10px' }}>No Image</div>
              )}
              <div>
                <h4 style={{ margin: '0 0 5px 0', color: '#1a1a1a', fontSize: '14px' }}>{place.name}</h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#555' }}>⭐ {place.rating || 'N/A'}</p>
                <p style={{ margin: '5px 0 0 0', fontSize: '12px', fontWeight: 'bold', color: '#3333ff' }}>📍 {place.distanceText} away</p>
              </div>
            </div>
          ))}
        </div>

        {/* MAP */}
        <div style={{ flex: 1, position: 'relative' }}>
          <Map 
            defaultCenter={userLocation} 
            center={userLocation}
            defaultZoom={15} 
            mapId="YOUR_MAP_ID" 
            disableDefaultUI={true}
          >
            <AdvancedMarker position={userLocation}>
              <span style={{ fontSize: '2.5rem' }}>📍</span>
            </AdvancedMarker>

            {places.map(place => (
              <AdvancedMarker 
                key={place.place_id} 
                position={place.location} 
                onClick={() => setSelectedPlace(place)}
              >
                <Pin background={selectedPlace?.place_id === place.place_id ? '#33d6ffff' : '#ff00cc'} glyphColor={'#fff'} borderColor={'#000'} />
              </AdvancedMarker>
            ))}
          </Map>

          {/* DETAIL PANEL */}
          {selectedPlace && (
            <div style={{
              position: 'absolute', top: '20px', right: '20px', width: '320px',
              backgroundColor: 'white', borderRadius: '15px', zIndex: 10,
              boxShadow: '0 8px 30px rgba(0,0,0,0.3)', overflow: 'hidden'
            }}>
              {selectedPlace.photo && <img src={selectedPlace.photo} style={{ width: '100%', height: '160px', objectFit: 'cover' }} alt={selectedPlace.name} />}
              <div style={{ padding: '20px' }}>
                <button onClick={() => setSelectedPlace(null)} style={{ float: 'right', border: 'none', background: '#f0f0f0', borderRadius: '50%', cursor: 'pointer', padding: '5px' }}>✕</button>
                <h3 style={{ margin: '0 0 10px 0', color: '#1a1a1a' }}>{selectedPlace.name}</h3>
                {isVibeLoading && (
  <p style={{ fontSize: '13px', color: '#666' }}>
    🤖 Analyzing vibe...
  </p>
)}

{aiVibe && !isVibeLoading && (
  <div style={{
    marginTop: '12px',
    padding: '10px',
    borderRadius: '10px',
    background: '#f4f6ff',
    fontSize: '13px'
  }}>
    <strong>AI Vibe</strong>
    <p style={{ margin: '6px 0' }}>{aiVibe.summary}</p>
    <p>☕ Cozy: {aiVibe.cozy}%</p>
    <p>🔊 Loud: {aiVibe.loud}%</p>
    <p>💻 Work-friendly: {aiVibe.workFriendly}%</p>
  </div>
)}


                <p style={{ fontSize: '14px', color: '#444' }}>{selectedPlace.summary || "A recommended spot based on your vibe."}</p>
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${selectedPlace.location.lat()},${selectedPlace.location.lng()}&query_place_id=${selectedPlace.place_id}`}
                  target="_blank" rel="noreferrer"
                  style={{ 
                    display: 'block', textAlign: 'center', padding: '12px', 
                    background: 'linear-gradient(to right, #ff00cc, #33c2ffff)', 
                    color: '#fff', borderRadius: '8px', textDecoration: 'none', marginTop: '15px', fontWeight: 'bold' 
                  }}
                >
                  Go Now
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </APIProvider>
  );
}