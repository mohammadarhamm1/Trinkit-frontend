import { useState, useEffect, useRef, useCallback } from "react";

// ─── CONFIG ────────────────────────────────────────────────────────────────
// ← Replace with your actual Render backend URL
const API = "https://trinkit.onrender.com/api";
const BASE = "https://trinkit.onrender.com";

// Smart image URL — fixes old localhost URLs stored in DB
const imgUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://localhost") || url.startsWith("https://localhost")) {
    return BASE + url.replace(/^https?:\/\/localhost:\d+/, "");
  }
  if (url.startsWith("http")) return url;
  return BASE + url;
};

const UPI_ID = "9258154802@axl";
const UPI_NAME = "Trinkit Store";

const apiFetch = async (path, options = {}, token = null) => {
  const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  const res = await fetch(`${API}${path}`, { ...options, headers: { ...headers, ...options.headers } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
};

const CATS = ["All","Vegetables","Dairy","Grains","Pulses","Oils","Snacks","Beverages","Spices","Essentials"];
const PROD_CATS = ["Vegetables","Dairy","Grains","Pulses","Oils","Snacks","Beverages","Spices","Essentials","Other"];
const CAT_ICONS = {All:"🏪",Vegetables:"🥦",Dairy:"🥛",Grains:"🌾",Pulses:"🫘",Oils:"🫒",Snacks:"🍿",Beverages:"🍵",Spices:"🌶️",Essentials:"🧂",Other:"📦"};
const STATUS_LABELS = {pending:"Pending",confirmed:"Confirmed",out:"Out for Delivery",delivered:"Delivered",cancelled:"Cancelled"};
const STATUS_STEPS = {pending:[true,false,false,false],confirmed:[true,true,false,false],out:[true,true,true,false],delivered:[true,true,true,true],cancelled:[true,false,false,false]};
const BLANK_PRODUCT = {name:"",qty:"",price:"",mrp:"",category:"Vegetables",emoji:"🛒",stock:"",description:"",image:""};

// ─── THEME ─────────────────────────────────────────────────────────────────
const G = "#1a8c4e";  // primary green
const GD = "#0d5c33"; // dark green
const GL = "#e8f5ee"; // light green bg

const s = {
  app:{ fontFamily:"'Segoe UI',sans-serif", background:"#f7f5f0", minHeight:"100vh", maxWidth:430, margin:"0 auto", position:"relative" },
  topbar:{ background:"#fff", padding:"10px 16px 10px", borderBottom:"1px solid #e4e0d8", position:"sticky", top:0, zIndex:100 },
  brand:{ fontWeight:800, fontSize:22, color:G },
  brandSpan:{ color:"#1a1a1a" },
  locBar:{ display:"flex", alignItems:"center", gap:6, padding:"0", cursor:"pointer", flex:1, minWidth:0 },
  locText:{ fontSize:13, fontWeight:700, color:"#1a1a1a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:200 },
  locSub:{ fontSize:11, color:"#6b6660", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" },
  iconBtn:{ background:"none", border:"none", cursor:"pointer", fontSize:20, position:"relative", padding:4 },
  badge:{ position:"absolute", top:-2, right:-2, background:"#e53935", color:"#fff", borderRadius:"50%", width:16, height:16, fontSize:9, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 },
  searchWrap:{ padding:"10px 16px" },
  searchBox:{ display:"flex", alignItems:"center", background:"#fff", border:"1.5px solid #e4e0d8", borderRadius:12, padding:"0 12px", gap:8 },
  searchInput:{ flex:1, border:"none", outline:"none", fontSize:14, padding:"10px 0", background:"transparent" },
  categories:{ display:"flex", gap:10, overflowX:"auto", padding:"0 16px 4px", scrollbarWidth:"none" },
  catChip:(a)=>({ flexShrink:0, display:"flex", flexDirection:"column", alignItems:"center", gap:4, cursor:"pointer", padding:"10px 14px", borderRadius:12, background:a?GL:"#fff", border:a?`1.5px solid ${G}`:"1.5px solid #e4e0d8", minWidth:70 }),
  sectionTitle:{ fontWeight:700, fontSize:16, padding:"0 16px", marginBottom:10 },
  productsGrid:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, padding:"0 16px 90px" },
  productCard:{ background:"#fff", borderRadius:14, border:"1px solid #e4e0d8", overflow:"hidden" },
  productImgFallback:{ width:"100%", height:110, display:"flex", alignItems:"center", justifyContent:"center", fontSize:44, background:"#f9f8f5" },
  productInfo:{ padding:10 },
  productFooter:{ display:"flex", justifyContent:"space-between", alignItems:"center" },
  addBtn:{ background:G, color:"#fff", border:"none", borderRadius:8, padding:"5px 12px", fontSize:13, fontWeight:700, cursor:"pointer" },
  qtyCtrl:{ display:"flex", alignItems:"center", gap:6 },
  qtyBtn:{ background:G, color:"#fff", border:"none", borderRadius:6, width:24, height:24, fontSize:15, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 },
  bottomNav:{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, background:"#fff", borderTop:"1px solid #e4e0d8", display:"flex", zIndex:200 },
  navItem:(a)=>({ flex:1, display:"flex", flexDirection:"column", alignItems:"center", padding:"10px 0", cursor:"pointer", gap:3, color:a?G:"#6b6660", fontSize:10, fontWeight:700, border:"none", background:"none" }),
  page:{ padding:"16px 16px 90px" },
  pageTitle:{ fontWeight:800, fontSize:20, marginBottom:16 },
  cartItem:{ background:"#fff", borderRadius:14, border:"1px solid #e4e0d8", padding:12, display:"flex", alignItems:"center", gap:12, marginBottom:10 },
  cartSummary:{ background:"#fff", borderRadius:14, border:"1px solid #e4e0d8", padding:14, marginTop:8 },
  summaryRow:(b)=>({ display:"flex", justifyContent:"space-between", fontSize:b?16:13, fontWeight:b?700:400, color:b?"#1a1a1a":"#6b6660", marginBottom:8, ...(b?{borderTop:"1px solid #e4e0d8",paddingTop:10,marginTop:4}:{}) }),
  primaryBtn:{ width:"100%", background:G, color:"#fff", border:"none", padding:14, borderRadius:12, fontSize:15, fontWeight:800, cursor:"pointer", marginTop:12 },
  statusBadge:(st)=>{ const m={pending:{bg:"#fff3e6",c:"#f57a00"},confirmed:{bg:"#e3f0ff",c:"#1565c0"},out:{bg:GL,c:G},delivered:{bg:"#f0fff4",c:"#2e7d32"},cancelled:{bg:"#fce8e8",c:"#c62828"}}[st]||{bg:"#f5f5f5",c:"#555"}; return {fontSize:11,fontWeight:700,padding:"4px 10px",borderRadius:20,background:m.bg,color:m.c}; },
  formGroup:{ marginBottom:14 },
  formLabel:{ fontSize:12, fontWeight:700, color:"#6b6660", marginBottom:5, textTransform:"uppercase", letterSpacing:.5, display:"block" },
  formInput:{ width:"100%", padding:"11px 14px", border:"1.5px solid #e4e0d8", borderRadius:10, fontSize:14, outline:"none", fontFamily:"inherit", background:"#fff" },
  toast:(c)=>({ position:"fixed", bottom:80, left:"50%", transform:"translateX(-50%)", background:c||"#1a1a1a", color:"#fff", padding:"10px 20px", borderRadius:12, fontSize:13, fontWeight:700, zIndex:9999, whiteSpace:"nowrap", boxShadow:"0 4px 20px rgba(0,0,0,.25)" }),
  spinner:{ display:"flex", justifyContent:"center", alignItems:"center", padding:40, color:"#6b6660", fontSize:14 },
  authCard:{ background:"#fff", borderRadius:16, border:"1px solid #e4e0d8", padding:24, margin:"32px 16px" },
  adminBar:{ background:"#1a1a1a", padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", position:"sticky", top:0, zIndex:100 },
  adminTab:(a)=>({ padding:"10px 16px", fontSize:13, fontWeight:700, cursor:"pointer", color:a?G:"#6b6660", borderBottom:a?`2px solid ${G}`:"2px solid transparent", marginBottom:-2, background:"none", border:"none", borderBottom:a?`2px solid ${G}`:"2px solid transparent" }),
  adminCard:{ background:"#fff", borderRadius:14, border:"1px solid #e4e0d8", padding:14, marginBottom:10 },
  statCard:{ background:"#fff", borderRadius:14, border:"1px solid #e4e0d8", padding:14, textAlign:"center" },
  overlay:{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", zIndex:500, display:"flex", alignItems:"flex-end", justifyContent:"center" },
  modal:{ background:"#fff", borderRadius:"20px 20px 0 0", width:"100%", maxWidth:430, maxHeight:"92vh", overflowY:"auto", padding:20 },
  confirmBox:{ background:"#fff", borderRadius:16, padding:24, margin:24, width:"100%", maxWidth:360 },
  payCard:(sel)=>({ border:sel?`2px solid ${G}`:"1.5px solid #e4e0d8", borderRadius:12, padding:"12px 14px", cursor:"pointer", background:sel?GL:"#fff", display:"flex", alignItems:"center", gap:12, marginBottom:10 }),
};

const Spinner = () => <div style={s.spinner}>⏳ Loading...</div>;
const EmptyState = ({icon,text,btnText,onBtn}) => (
  <div style={{textAlign:"center",padding:"48px 16px",color:"#6b6660"}}>
    <div style={{fontSize:52,marginBottom:12}}>{icon}</div>
    <p style={{marginBottom:16}}>{text}</p>
    {btnText&&<button onClick={onBtn} style={{...s.addBtn,padding:"10px 20px",borderRadius:8}}>{btnText}</button>}
  </div>
);

// ─── LOCATION PICKER MODAL ─────────────────────────────────────────────────
function LocationModal({ onSave, onClose, currentLocation }) {
  const [step, setStep] = useState("options");
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState(currentLocation?.coords || null);
  const [address, setAddress] = useState(currentLocation?.address || "");
  const [flatNo, setFlatNo] = useState(currentLocation?.flatNo || "");
  const [landmark, setLandmark] = useState(currentLocation?.landmark || "");
  const [pincode, setPincode] = useState(currentLocation?.pincode || "");
  const [locType, setLocType] = useState(currentLocation?.type || "Home");
  const [error, setError] = useState("");
  const mapRef = useRef();
  const markerRef = useRef();
  const mapInstanceRef = useRef();

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      const data = await res.json();
      return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch { return `${lat.toFixed(4)}, ${lng.toFixed(4)}`; }
  };

  const useGPS = () => {
    setLocating(true); setError("");
    if (!navigator.geolocation) {
      setError("GPS not supported on this browser. Please use Chrome or Firefox.");
      setLocating(false); return;
    }
    // Check if we're on HTTPS — GPS requires HTTPS on mobile
    if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
      setError("GPS requires HTTPS. Your site must be accessed via https://");
      setLocating(false); return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const addr = await reverseGeocode(lat, lng);
        setCoords({ lat, lng });
        setAddress(addr);
        setLocating(false);
        setStep("confirm");
      },
      (err) => {
        let msg = "Could not get location. ";
        if (err.code === 1) msg += "Please allow location access in your browser settings, then try again.";
        else if (err.code === 2) msg += "GPS signal not available. Try moving outdoors or use 'Pick on map'.";
        else if (err.code === 3) msg += "Location request timed out. Try 'Pick on map' instead.";
        setError(msg);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Load Leaflet map — centers on real GPS if available
  useEffect(() => {
    if (step !== "map") return;
    const initMap = async () => {
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css"; link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }
      if (!window.L) {
        await new Promise((res, rej) => {
          const script = document.createElement("script");
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          script.onload = res; script.onerror = rej;
          document.body.appendChild(script);
        });
      }
      const L = window.L;

      // Try to get real GPS location to center the map
      const getStartCoords = () => new Promise((resolve) => {
        if (coords) { resolve(coords); return; }
        if (!navigator.geolocation) { resolve({ lat: 28.6139, lng: 77.2090 }); return; } // Delhi fallback
        navigator.geolocation.getCurrentPosition(
          pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve({ lat: 28.6139, lng: 77.2090 }), // Delhi fallback if GPS fails
          { enableHighAccuracy: true, timeout: 8000 }
        );
      });

      const startCoords = await getStartCoords();

      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); }
      setTimeout(() => {
        if (!mapRef.current) return;
        const map = L.map(mapRef.current).setView([startCoords.lat, startCoords.lng], 17);
        mapInstanceRef.current = map;
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors"
        }).addTo(map);
        const icon = L.divIcon({
          html: `<div style="width:32px;height:32px;background:${G};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4)"></div>`,
          iconSize:[32,32], iconAnchor:[16,32], className:""
        });
        const marker = L.marker([startCoords.lat, startCoords.lng], { icon, draggable: true }).addTo(map);
        markerRef.current = marker;
        // Set initial address if we got GPS
        if (!coords) {
          reverseGeocode(startCoords.lat, startCoords.lng).then(addr => {
            setCoords(startCoords);
            setAddress(addr);
          });
        }
        marker.on("dragend", async (e) => {
          const { lat, lng } = e.target.getLatLng();
          const addr = await reverseGeocode(lat, lng);
          setCoords({ lat, lng });
          setAddress(addr);
        });
        map.on("click", async (e) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          const addr = await reverseGeocode(lat, lng);
          setCoords({ lat, lng });
          setAddress(addr);
        });
      }, 100);
    };
    initMap();
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, [step]);

  const handleSave = () => {
    if (!address) { setError("Please set a delivery location first."); return; }
    onSave({ address, flatNo, landmark, pincode, type: locType, coords });
  };

  return (
    <div style={{...s.overlay, alignItems: step==="map" ? "stretch" : "flex-end"}}>
      <div style={{...s.modal, ...(step==="map"?{borderRadius:0,maxHeight:"100vh",height:"100vh",padding:0,display:"flex",flexDirection:"column"}:{})}}>

        {/* OPTIONS STEP */}
        {step==="options" && (
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontWeight:800,fontSize:18}}>Set Delivery Location</div>
              <button onClick={onClose} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#6b6660"}}>✕</button>
            </div>
            {/* GPS option */}
            <button onClick={useGPS} disabled={locating} style={{width:"100%",border:`1.5px solid ${G}`,background:GL,borderRadius:14,padding:16,display:"flex",alignItems:"center",gap:14,cursor:"pointer",marginBottom:12,textAlign:"left"}}>
              <div style={{fontSize:32}}>📍</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:15,color:G}}>{locating?"Detecting your location...":"Use my current location"}</div>
                <div style={{fontSize:12,color:"#6b6660",marginTop:2}}>Most accurate • Requires location permission</div>
              </div>
              {locating && <div style={{marginLeft:"auto",fontSize:18}}>⏳</div>}
            </button>
            <button onClick={()=>setStep("map")} style={{width:"100%",border:"1.5px solid #e4e0d8",background:"#fff",borderRadius:14,padding:16,display:"flex",alignItems:"center",gap:14,cursor:"pointer",marginBottom:12,textAlign:"left"}}>
              <div style={{fontSize:32}}>🗺️</div>
              <div>
                <div style={{fontWeight:700,fontSize:15}}>Pick on map</div>
                <div style={{fontSize:12,color:"#6b6660",marginTop:2}}>Opens map centered on your location — drag pin to exact spot</div>
              </div>
            </button>
            {/* Manual option */}
            <button onClick={()=>setStep("manual")} style={{width:"100%",border:"1.5px solid #e4e0d8",background:"#fff",borderRadius:14,padding:16,display:"flex",alignItems:"center",gap:14,cursor:"pointer",marginBottom:12,textAlign:"left"}}>
              <div style={{fontSize:32}}>✏️</div>
              <div>
                <div style={{fontWeight:700,fontSize:15}}>Enter address manually</div>
                <div style={{fontSize:12,color:"#6b6660",marginTop:2}}>Type your full delivery address</div>
              </div>
            </button>
            {error&&<div style={{color:"#e53935",fontSize:13,marginTop:8,textAlign:"center"}}>{error}</div>}
          </div>
        )}

        {/* MAP STEP */}
        {step==="map" && (
          <div style={{flex:1,display:"flex",flexDirection:"column",height:"100%"}}>
            {/* Map header */}
            <div style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:10,background:"#fff",borderBottom:"1px solid #e4e0d8",zIndex:10}}>
              <button onClick={()=>setStep("options")} style={{background:"none",border:"none",fontSize:20,cursor:"pointer"}}>←</button>
              <div style={{fontWeight:700,fontSize:16}}>Pin your location</div>
            </div>
            {/* Map container */}
            <div style={{flex:1,position:"relative"}}>
              <div ref={mapRef} style={{width:"100%",height:"100%",minHeight:350}}/>
              {/* Instruction overlay */}
              <div style={{position:"absolute",top:12,left:"50%",transform:"translateX(-50%)",background:"rgba(0,0,0,.7)",color:"#fff",padding:"8px 16px",borderRadius:20,fontSize:12,fontWeight:600,whiteSpace:"nowrap",zIndex:500,pointerEvents:"none"}}>
                📌 Tap or drag pin to your location
              </div>
            </div>
            {/* Bottom sheet */}
            <div style={{background:"#fff",padding:16,borderTop:"1px solid #e4e0d8"}}>
              {address && (
                <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:12,background:GL,borderRadius:10,padding:"10px 12px"}}>
                  <span style={{fontSize:18,marginTop:1}}>📍</span>
                  <div style={{flex:1,fontSize:13,color:"#1a1a1a",lineHeight:1.4}}>{address}</div>
                </div>
              )}
              <button onClick={()=>address&&setStep("confirm")} disabled={!address} style={{...s.primaryBtn,marginTop:0,opacity:address?1:.5}}>
                Confirm This Location →
              </button>
            </div>
          </div>
        )}

        {/* MANUAL STEP */}
        {step==="manual" && (
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
              <button onClick={()=>setStep("options")} style={{background:"none",border:"none",fontSize:20,cursor:"pointer"}}>←</button>
              <div style={{fontWeight:800,fontSize:18}}>Enter Address</div>
            </div>
            <div style={s.formGroup}>
              <label style={s.formLabel}>Full Address *</label>
              <input style={s.formInput} placeholder="House no, Street, Area, City" value={address} onChange={e=>setAddress(e.target.value)}/>
            </div>
            <div style={s.formGroup}>
              <label style={s.formLabel}>Flat / House No.</label>
              <input style={s.formInput} placeholder="e.g. 12B, First Floor" value={flatNo} onChange={e=>setFlatNo(e.target.value)}/>
            </div>
            <div style={s.formGroup}>
              <label style={s.formLabel}>Landmark</label>
              <input style={s.formInput} placeholder="e.g. Near Ram Mandir" value={landmark} onChange={e=>setLandmark(e.target.value)}/>
            </div>
            {error&&<div style={{color:"#e53935",fontSize:13,marginBottom:8}}>{error}</div>}
            <button onClick={()=>{ if(!address){setError("Please enter your address.");return;} setStep("confirm"); }} style={s.primaryBtn}>
              Continue →
            </button>
          </div>
        )}

        {/* CONFIRM STEP */}
        {step==="confirm" && (
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
              <button onClick={()=>setStep("options")} style={{background:"none",border:"none",fontSize:20,cursor:"pointer"}}>←</button>
              <div style={{fontWeight:800,fontSize:18}}>Confirm Location</div>
            </div>
            {/* Address preview */}
            <div style={{background:GL,borderRadius:12,padding:"12px 14px",marginBottom:16,display:"flex",gap:10}}>
              <span style={{fontSize:22,marginTop:2}}>📍</span>
              <div style={{flex:1,fontSize:13,color:"#1a1a1a",lineHeight:1.5}}>{address}</div>
            </div>
            {/* Flat / landmark */}
            <div style={s.formGroup}>
              <label style={s.formLabel}>Flat / House No.</label>
              <input style={s.formInput} placeholder="e.g. 12B, First Floor" value={flatNo} onChange={e=>setFlatNo(e.target.value)}/>
            </div>
            <div style={s.formGroup}>
              <label style={s.formLabel}>Landmark (optional)</label>
              <input style={s.formInput} placeholder="e.g. Near Ram Mandir" value={landmark} onChange={e=>setLandmark(e.target.value)}/>
            </div>
            <div style={s.formGroup}>
              <label style={s.formLabel}>Pin Code</label>
              <input style={s.formInput} placeholder="e.g. 250001" type="number" value={pincode} onChange={e=>setPincode(e.target.value)}/>
            </div>
            {/* Save as */}
            <div style={s.formGroup}>
              <label style={s.formLabel}>Save As</label>
              <div style={{display:"flex",gap:8}}>
                {["Home","Work","Other"].map(t=>(
                  <button key={t} onClick={()=>setLocType(t)} style={{flex:1,padding:"8px 0",borderRadius:8,border:locType===t?`2px solid ${G}`:"1.5px solid #e4e0d8",background:locType===t?GL:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",color:locType===t?G:"#6b6660"}}>
                    {t==="Home"?"🏠 Home":t==="Work"?"🏢 Work":"📌 Other"}
                  </button>
                ))}
              </div>
            </div>
            {error&&<div style={{color:"#e53935",fontSize:13,marginBottom:8}}>{error}</div>}
            <button onClick={handleSave} style={s.primaryBtn}>✅ Save This Location</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── UPI PAYMENT MODAL ─────────────────────────────────────────────────────
function UpiPaymentModal({ amount, onPaid, onCancel }) {
  const [copied, setCopied] = useState(false);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${amount}&cu=INR`)}`;
  const copyUpiId = () => { navigator.clipboard.writeText(UPI_ID).then(()=>{ setCopied(true); setTimeout(()=>setCopied(false),2000); }); };
  return (
    <div style={s.overlay} onClick={e=>e.target===e.currentTarget&&onCancel()}>
      <div style={s.modal}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
          <div style={{fontWeight:800,fontSize:18}}>Pay via UPI</div>
          <button onClick={onCancel} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#6b6660"}}>✕</button>
        </div>
        <div style={{fontSize:13,color:"#6b6660",marginBottom:20}}>Scan QR or copy UPI ID to pay</div>
        <div style={{background:GL,borderRadius:12,padding:"12px 16px",textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:12,color:G,fontWeight:700,marginBottom:4}}>TOTAL AMOUNT</div>
          <div style={{fontWeight:800,fontSize:32,color:G}}>₹{amount}</div>
        </div>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:12,fontWeight:700,color:"#6b6660",marginBottom:10,textTransform:"uppercase",letterSpacing:.5}}>Scan with any UPI App</div>
          <div style={{display:"inline-block",border:"2px solid #e4e0d8",borderRadius:12,padding:10,background:"#fff"}}>
            <img src={qrUrl} alt="UPI QR Code" style={{width:180,height:180,display:"block"}}/>
          </div>
          <div style={{fontSize:12,color:"#aaa",marginTop:8}}>GPay • PhonePe • Paytm • BHIM • Any UPI</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
          <div style={{flex:1,height:1,background:"#e4e0d8"}}/><span style={{fontSize:12,color:"#aaa",fontWeight:600}}>OR</span><div style={{flex:1,height:1,background:"#e4e0d8"}}/>
        </div>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:12,fontWeight:700,color:"#6b6660",marginBottom:8,textTransform:"uppercase",letterSpacing:.5}}>Copy UPI ID</div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div style={{flex:1,background:"#f9f8f5",border:"1.5px solid #e4e0d8",borderRadius:10,padding:"12px 14px",fontSize:15,fontWeight:700,color:"#1a1a1a"}}>{UPI_ID}</div>
            <button onClick={copyUpiId} style={{background:copied?"#e8f5ee":G,color:copied?G:"#fff",border:"none",padding:"12px 16px",borderRadius:10,fontWeight:700,fontSize:13,cursor:"pointer",minWidth:72}}>{copied?"✓ Copied":"Copy"}</button>
          </div>
          <div style={{fontSize:11,color:"#aaa",marginTop:6}}>Pay to: <b style={{color:"#1a1a1a"}}>{UPI_NAME}</b></div>
        </div>
        <div style={{background:"#fffbf0",border:"1px solid #ffe0b2",borderRadius:10,padding:"10px 14px",marginBottom:20,fontSize:12,color:"#7c4a00"}}>
          📌 After paying, tap <b>"I've Paid"</b> below. Your order will be confirmed once we verify the payment.
        </div>
        <button onClick={onPaid} style={{...s.primaryBtn,background:"#1a8c4e",marginTop:0}}>✅ I've Paid — Confirm Order</button>
        <button onClick={onCancel} style={{width:"100%",background:"none",border:"none",padding:"10px",color:"#6b6660",fontSize:13,cursor:"pointer",marginTop:6}}>Cancel</button>
      </div>
    </div>
  );
}

// ─── PRODUCT FORM MODAL ────────────────────────────────────────────────────
function ProductModal({ product, token, onClose, onSaved, showToast }) {
  const [form, setForm] = useState(product ? {...product, price:String(product.price), mrp:String(product.mrp||""), stock:String(product.stock)} : {...BLANK_PRODUCT});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(product?.image ? (imgUrl(product.image)) : null);
  const fileRef = useRef();
  const isEdit = !!product?._id;
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleImageSelect = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
    setUploading(true);
    try {
      const formData = new FormData(); formData.append("image", file);
      const res = await fetch(`${API}/upload/product-image`, { method:"POST", headers:{Authorization:`Bearer ${token}`}, body:formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      set("image", data.imageUrl);
      showToast("Image uploaded ✓", G);
    } catch(e) { showToast(e.message,"#e53935"); setImagePreview(null); } finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!form.name||!form.price||!form.qty||!form.stock) { showToast("Fill all required fields","#e53935"); return; }
    setSaving(true);
    try {
      const body = { ...form, price:Number(form.price), mrp:form.mrp?Number(form.mrp):undefined, stock:Number(form.stock) };
      const data = isEdit
        ? await apiFetch(`/products/${product._id}`,{method:"PUT",body:JSON.stringify(body)},token)
        : await apiFetch("/products",{method:"POST",body:JSON.stringify(body)},token);
      onSaved(data.product, isEdit);
      showToast(isEdit?"Product updated ✓":"Product added ✓",G);
      onClose();
    } catch(e) { showToast(e.message,"#e53935"); } finally { setSaving(false); }
  };

  return (
    <div style={s.overlay} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={s.modal}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontWeight:800,fontSize:18}}>{isEdit?"Edit Product":"Add New Product"}</div>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#6b6660"}}>✕</button>
        </div>
        <div style={s.formGroup}>
          <label style={s.formLabel}>Product Image</label>
          <div onClick={()=>!uploading&&fileRef.current.click()} style={{border:"2px dashed #e4e0d8",borderRadius:12,height:140,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",overflow:"hidden",background:"#fafafa",position:"relative"}}>
            {imagePreview ? (<>
              <img src={imagePreview} alt="preview" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
              <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.35)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{color:"#fff",fontWeight:700,fontSize:13}}>📷 Change Photo</span>
              </div>
            </>) : (<>
              <div style={{fontSize:36,marginBottom:8}}>📷</div>
              <div style={{fontSize:13,fontWeight:600,color:"#6b6660"}}>{uploading?"Uploading...":"Tap to upload photo"}</div>
              <div style={{fontSize:11,color:"#aaa",marginTop:4}}>JPG, PNG or WEBP • Max 5MB</div>
            </>)}
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{display:"none"}} onChange={handleImageSelect}/>
        </div>
        <div style={s.formGroup}><label style={s.formLabel}>Product Name *</label><input style={s.formInput} placeholder="e.g. Basmati Rice" value={form.name} onChange={e=>set("name",e.target.value)}/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div style={s.formGroup}><label style={s.formLabel}>Category *</label><select style={{...s.formInput,padding:"11px 10px"}} value={form.category} onChange={e=>set("category",e.target.value)}>{PROD_CATS.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
          <div style={s.formGroup}><label style={s.formLabel}>Qty / Unit *</label><input style={s.formInput} placeholder="1 kg, 500 g" value={form.qty} onChange={e=>set("qty",e.target.value)}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          <div style={s.formGroup}><label style={s.formLabel}>Price ₹ *</label><input style={s.formInput} type="number" placeholder="299" value={form.price} onChange={e=>set("price",e.target.value)}/></div>
          <div style={s.formGroup}><label style={s.formLabel}>MRP ₹</label><input style={s.formInput} type="number" placeholder="350" value={form.mrp} onChange={e=>set("mrp",e.target.value)}/></div>
          <div style={s.formGroup}><label style={s.formLabel}>Stock *</label><input style={s.formInput} type="number" placeholder="50" value={form.stock} onChange={e=>set("stock",e.target.value)}/></div>
        </div>
        <div style={s.formGroup}><label style={s.formLabel}>Description</label><input style={s.formInput} placeholder="Optional" value={form.description} onChange={e=>set("description",e.target.value)}/></div>
        <div style={{display:"flex",gap:10,marginTop:4}}>
          <button onClick={onClose} style={{flex:1,background:"#fff",color:"#1a1a1a",border:"1.5px solid #e4e0d8",padding:12,borderRadius:10,fontWeight:700,fontSize:14,cursor:"pointer"}}>Cancel</button>
          <button onClick={handleSave} disabled={saving||uploading} style={{flex:2,background:G,color:"#fff",border:"none",padding:12,borderRadius:10,fontWeight:800,fontSize:14,cursor:"pointer"}}>{saving?"Saving...":(isEdit?"Save Changes":"Add Product")}</button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{...s.overlay,alignItems:"center"}}>
      <div style={s.confirmBox}>
        <div style={{fontSize:36,textAlign:"center",marginBottom:12}}>⚠️</div>
        <div style={{fontWeight:700,fontSize:16,textAlign:"center",marginBottom:8}}>Are you sure?</div>
        <div style={{fontSize:14,color:"#6b6660",textAlign:"center",marginBottom:20}}>{message}</div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onCancel} style={{flex:1,background:"#fff",border:"1.5px solid #e4e0d8",padding:12,borderRadius:10,fontWeight:700,fontSize:14,cursor:"pointer"}}>Cancel</button>
          <button onClick={onConfirm} style={{flex:1,background:"#e53935",color:"#fff",border:"none",padding:12,borderRadius:10,fontWeight:800,fontSize:14,cursor:"pointer"}}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════
// ─── CART VIEW (top-level component — fixes input focus loss bug) ──────────
function CartView({ checkoutStep, setCheckoutStep, paymentMethod, setPaymentMethod,
  deliveryForm, setDeliveryForm, cart, products, cartCount, cartTotal, deliveryFee,
  token, loading, location, locLabel, setView, setShowLocationModal,
  setShowUpiModal, handlePayNow, addToCart, removeFromCart, showToast }) {

  if (checkoutStep==="success") return (
    <div style={{...s.page,textAlign:"center",paddingTop:60}}>
      <div style={{fontSize:64,marginBottom:16}}>{paymentMethod==="upi"?"📱":"📦"}</div>
      <div style={{fontWeight:800,fontSize:22,color:G,marginBottom:8}}>Order Placed!</div>
      <div style={{color:"#6b6660",fontSize:14,marginBottom:8}}>{paymentMethod==="upi"?"We'll confirm after verifying your UPI payment.":"Cash on Delivery order confirmed!"}</div>
      <div style={{color:"#6b6660",fontSize:14,marginBottom:24}}>Expected delivery in 30–45 minutes.</div>
      <button style={s.primaryBtn} onClick={()=>{setView("home");setCheckoutStep("cart");setPaymentMethod("upi");}}>Continue Shopping</button>
      <button style={{...s.primaryBtn,background:"#fff",color:G,border:`1.5px solid ${G}`,marginTop:8}} onClick={()=>{setView("orders");setCheckoutStep("cart");}}>View My Orders</button>
    </div>
  );

  if (checkoutStep==="form") return (
    <div style={s.page}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
        <button onClick={()=>setCheckoutStep("cart")} style={{background:"none",border:"none",fontSize:20,cursor:"pointer"}}>←</button>
        <div style={{...s.pageTitle,margin:0}}>Delivery Details</div>
      </div>
      {location && (
        <div style={{background:GL,borderRadius:12,padding:"10px 14px",marginBottom:14,display:"flex",gap:10,alignItems:"center"}}>
          <span style={{fontSize:20}}>📍</span>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:13,color:G}}>{location.type||"Saved"} Location</div>
            <div style={{fontSize:12,color:"#6b6660",lineHeight:1.4}}>{locLabel}</div>
          </div>
          <button onClick={()=>setShowLocationModal(true)} style={{background:"none",border:`1px solid ${G}`,color:G,padding:"4px 10px",borderRadius:6,fontSize:11,fontWeight:700,cursor:"pointer"}}>Change</button>
        </div>
      )}
      {[{f:"name",l:"Full Name",ph:"Rakesh Sharma"},{f:"phone",l:"Phone",ph:"9876543210",t:"tel"},{f:"address",l:"Full Address",ph:"12 Ram Nagar, Near Temple"},{f:"pincode",l:"Pin Code",ph:"250001",t:"number"},{f:"note",l:"Note (optional)",ph:"Leave at gate"}].map(({f,l,ph,t})=>(
        <div key={f} style={s.formGroup}>
          <label style={s.formLabel}>{l}</label>
          <input
            style={s.formInput}
            placeholder={ph}
            type={t||"text"}
            value={deliveryForm[f]}
            onChange={e=>setDeliveryForm(fm=>({...fm,[f]:e.target.value}))}
          />
        </div>
      ))}
      <button style={s.primaryBtn} onClick={()=>{
        if (!deliveryForm.name||!deliveryForm.phone||!deliveryForm.address||!deliveryForm.pincode) { showToast("Fill all required fields","#e53935"); return; }
        setCheckoutStep("payment");
      }}>Continue to Payment →</button>
    </div>
  );

  if (checkoutStep==="payment") return (
    <div style={s.page}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
        <button onClick={()=>setCheckoutStep("form")} style={{background:"none",border:"none",fontSize:20,cursor:"pointer"}}>←</button>
        <div style={{...s.pageTitle,margin:0}}>Payment Method</div>
      </div>
      <div style={s.payCard(paymentMethod==="upi")} onClick={()=>setPaymentMethod("upi")}>
        <div style={{fontSize:32}}>📱</div>
        <div style={{flex:1}}><div style={{fontWeight:700,fontSize:15}}>UPI Payment</div><div style={{fontSize:12,color:"#6b6660"}}>GPay, PhonePe, Paytm, BHIM & more</div></div>
        <div style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${paymentMethod==="upi"?G:"#ccc"}`,display:"flex",alignItems:"center",justifyContent:"center"}}>{paymentMethod==="upi"&&<div style={{width:10,height:10,borderRadius:"50%",background:G}}/>}</div>
      </div>
      <div style={s.payCard(paymentMethod==="cod")} onClick={()=>setPaymentMethod("cod")}>
        <div style={{fontSize:32}}>💵</div>
        <div style={{flex:1}}><div style={{fontWeight:700,fontSize:15}}>Cash on Delivery</div><div style={{fontSize:12,color:"#6b6660"}}>Pay when your order arrives</div></div>
        <div style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${paymentMethod==="cod"?G:"#ccc"}`,display:"flex",alignItems:"center",justifyContent:"center"}}>{paymentMethod==="cod"&&<div style={{width:10,height:10,borderRadius:"50%",background:G}}/>}</div>
      </div>
      <div style={s.cartSummary}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:10}}>Order Summary</div>
        <div style={s.summaryRow(false)}><span>Subtotal</span><span>₹{cartTotal}</span></div>
        <div style={s.summaryRow(false)}><span>Delivery Fee</span><span>{deliveryFee===0?"🎉 FREE":"₹"+deliveryFee}</span></div>
        <div style={s.summaryRow(true)}><span>Total</span><span>₹{cartTotal+deliveryFee}</span></div>
      </div>
      <button style={{...s.primaryBtn,background:paymentMethod==="upi"?G:"#f57a00"}} onClick={handlePayNow} disabled={loading}>
        {loading?"Processing...":paymentMethod==="upi"?`Pay ₹${cartTotal+deliveryFee} via UPI 📱`:`Place COD Order ₹${cartTotal+deliveryFee} 💵`}
      </button>
    </div>
  );

  const cartItems = Object.entries(cart).map(([id,qty])=>({...products.find(p=>p._id===id),qty})).filter(p=>p._id);
  return (
    <div style={s.page}>
      <div style={s.pageTitle}>My Cart {cartCount>0?`(${cartCount})`:""}</div>
      {cartItems.length===0 ? <EmptyState icon="🛒" text="Your cart is empty" btnText="Start Shopping" onBtn={()=>setView("home")}/> : (
        <div>
          {/* Free delivery banner */}
          {deliveryFee===0 ? (
            <div style={{background:"#e8f5ee",border:"1px solid #b7dfca",borderRadius:10,padding:"8px 12px",marginBottom:12,fontSize:13,color:G,fontWeight:600,textAlign:"center"}}>
              🎉 You get FREE delivery on this order!
            </div>
          ) : (
            <div style={{background:"#fff8e1",border:"1px solid #ffe082",borderRadius:10,padding:"8px 12px",marginBottom:12,fontSize:12,color:"#7c5a00",textAlign:"center"}}>
              <span style={{fontWeight:700}}>Add ₹{100-cartTotal} more</span> for 🎉 FREE delivery (orders above ₹100)
            </div>
          )}
          {cartItems.map(item=>(
            <div key={item._id} style={s.cartItem}>
              <div style={{width:52,height:52,borderRadius:10,overflow:"hidden",flexShrink:0,background:"#f9f8f5",display:"flex",alignItems:"center",justifyContent:"center"}}>
                {item.image?<img src={imgUrl(item.image)} alt={item.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:26}}>{item.emoji||"🛒"}</span>}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:13,marginBottom:2}}>{item.name}</div>
                <div style={{fontSize:11,color:"#6b6660",marginBottom:4}}>{item.qty}</div>
                <div style={{fontSize:13,color:G,fontWeight:700}}>₹{item.price} × {item.qty} = ₹{item.price*item.qty}</div>
              </div>
              <div style={s.qtyCtrl}>
                <button style={s.qtyBtn} onClick={()=>removeFromCart(item._id)}>-</button>
                <span style={{fontWeight:700,fontSize:14,minWidth:18,textAlign:"center"}}>{item.qty}</span>
                <button style={s.qtyBtn} onClick={()=>addToCart(item._id)}>+</button>
              </div>
            </div>
          ))}
          <div style={s.cartSummary}>
            <div style={s.summaryRow(false)}><span>Subtotal</span><span>₹{cartTotal}</span></div>
            <div style={s.summaryRow(false)}><span>Delivery Fee</span><span>{deliveryFee===0?"🎉 FREE":"₹"+deliveryFee}</span></div>
            <div style={s.summaryRow(true)}><span>Total</span><span>₹{cartTotal+deliveryFee}</span></div>
          </div>
          <button style={s.primaryBtn} onClick={()=>{if(!token){setView("auth");return;}setCheckoutStep("form");}}>
            {token?"Proceed to Checkout →":"Login to Checkout"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── ORDERS VIEW (top-level component — fixes input focus loss bug) ─────────
function OrdersView({ orders, token, loading, setView }) {
  if (!token) return <EmptyState icon="🔐" text="Login to view your orders" btnText="Login" onBtn={()=>setView("auth")}/>;
  if (loading) return <Spinner/>;
  return (
    <div style={s.page}>
      <div style={s.pageTitle}>My Orders</div>
      {orders.length===0?<EmptyState icon="📦" text="No orders yet!" btnText="Shop Now" onBtn={()=>setView("home")}/>:
        orders.map(o=>(
          <div key={o._id} style={s.adminCard}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span style={{fontWeight:700,fontSize:14}}>{o.orderId}</span>
              <div style={{textAlign:"right"}}>
                <span style={s.statusBadge(o.status)}>{STATUS_LABELS[o.status]}</span>
                <div style={{fontSize:10,marginTop:3,color:o.paymentMethod==="online"?G:"#f57a00",fontWeight:700}}>{o.paymentMethod==="online"?"📱 UPI":"💵 COD"}</div>
              </div>
            </div>
            <div style={{fontSize:12,color:"#6b6660",marginBottom:8}}>{new Date(o.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})} • ₹{o.pricing?.total}</div>
            <div style={{fontSize:12,color:"#444",marginBottom:12}}>{o.items.map(i=>`${i.name} ×${i.qty}`).join(" • ")}</div>
            {["Order Placed","Confirmed","Out for Delivery","Delivered"].map((step,i)=>{
              const steps=STATUS_STEPS[o.status]||[true,false,false,false];
              const isDone=steps[i]; const isLast=isDone&&i===steps.filter(Boolean).length-1;
              return (
                <div key={step} style={{display:"flex",gap:10,alignItems:"flex-start",paddingBottom:i<3?10:0,position:"relative"}}>
                  {i<3&&<div style={{position:"absolute",left:9,top:20,width:2,height:"calc(100% - 8px)",background:"#e4e0d8",zIndex:0}}/>}
                  <div style={{width:20,height:20,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,marginTop:1,zIndex:1,background:isLast?"#f57a00":isDone?G:"#e4e0d8",color:isDone?"#fff":"#6b6660"}}>{isDone?"✓":""}</div>
                  <div>
                    <div style={{fontSize:13,fontWeight:500,color:isLast?"#f57a00":isDone?G:"#6b6660"}}>{step}</div>
                    <div style={{fontSize:11,color:"#6b6660"}}>{isDone?"Completed":"Pending"}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ))
      }
    </div>
  );
}

// ─── RIDER MAP MODAL ──────────────────────────────────────────────────────
function RiderMapModal({ order, onClose }) {
  const mapRef = useRef();
  const mapInstanceRef = useRef();
  const coords = order?.deliveryAddress?.coords;
  const address = order?.deliveryAddress?.address || "";
  const flatNo = order?.deliveryAddress?.flatNo || "";
  const phone = order?.deliveryAddress?.phone || "";

  useEffect(() => {
    const initMap = async () => {
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css"; link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }
      if (!window.L) {
        await new Promise((res, rej) => {
          const script = document.createElement("script");
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          script.onload = res; script.onerror = rej;
          document.body.appendChild(script);
        });
      }
      const L = window.L;

      // Use pinned coords if available, otherwise geocode the address string
      let lat = coords?.lat;
      let lng = coords?.lng;
      if (!lat || !lng) {
        try {
          const query = [flatNo, address].filter(Boolean).join(", ");
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`);
          const data = await res.json();
          if (data && data[0]) { lat = parseFloat(data[0].lat); lng = parseFloat(data[0].lon); }
        } catch {}
      }

      // If still no coords, show a helpful error instead of wrong city
      if (!lat || !lng) {
        if (mapRef.current) mapRef.current.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;gap:10px;color:#6b6660;padding:24px;text-align:center"><div style="font-size:40px">📍</div><div style="font-weight:700;font-size:15px;color:#e53935">Exact location not available</div><div style="font-size:13px">Customer did not pin location on map.<br/>Use the address below to navigate.</div></div>`;
        return;
      }

      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); }
      setTimeout(() => {
        if (!mapRef.current) return;
        const map = L.map(mapRef.current).setView([lat, lng], 17);
        mapInstanceRef.current = map;
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap"
        }).addTo(map);
        const icon = L.divIcon({
          html: `<div style="background:#e53935;width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;"></div>`,
          iconSize:[36,36], iconAnchor:[18,36], className:""
        });
        const marker = L.marker([lat, lng], {icon}).addTo(map);
        marker.bindPopup(`<b>${flatNo ? flatNo+", " : ""}${address.split(",").slice(0,2).join(",")}</b><br>${phone}`).openPopup();
      }, 150);
    };
    initMap();
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, []);

  const openGoogleMaps = () => {
    if (coords) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`, "_blank");
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([flatNo, address].filter(Boolean).join(", "))}`, "_blank");
    }
  };

  return (
    <div style={{...s.overlay, alignItems:"stretch"}}>
      <div style={{...s.modal, borderRadius:0, maxHeight:"100vh", height:"100vh", padding:0, display:"flex", flexDirection:"column"}}>
        {/* Header */}
        <div style={{padding:"14px 16px", background:"#fff", borderBottom:"1px solid #e4e0d8", display:"flex", alignItems:"center", gap:10}}>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer"}}>←</button>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:15}}>Delivery Location</div>
            <div style={{fontSize:12,color:"#6b6660"}}>{order.orderId} • {order.customer?.name}</div>
          </div>
          <button onClick={openGoogleMaps} style={{background:G,color:"#fff",border:"none",padding:"8px 14px",borderRadius:8,fontWeight:700,fontSize:12,cursor:"pointer"}}>
            🗺 Navigate
          </button>
        </div>
        {/* Map */}
        <div style={{flex:1, position:"relative"}}>
          {!coords && (
            <div style={{position:"absolute",top:12,left:"50%",transform:"translateX(-50%)",background:"rgba(229,57,53,.9)",color:"#fff",padding:"8px 16px",borderRadius:20,fontSize:12,fontWeight:600,zIndex:500,textAlign:"center",whiteSpace:"nowrap"}}>
              ⚠️ Customer did not pin location — showing approximate address
            </div>
          )}
          <div ref={mapRef} style={{width:"100%",height:"100%",minHeight:350}}/>
        </div>
        {/* Address info */}
        <div style={{background:"#fff", padding:"14px 16px", borderTop:"1px solid #e4e0d8"}}>
          <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:10}}>
            <span style={{fontSize:20}}>📍</span>
            <div>
              {flatNo && <div style={{fontWeight:700,fontSize:14}}>{flatNo}</div>}
              <div style={{fontSize:13,color:"#444",lineHeight:1.5}}>{address}</div>
              {order.deliveryAddress?.landmark && <div style={{fontSize:12,color:"#6b6660"}}>Near: {order.deliveryAddress.landmark}</div>}
            </div>
          </div>
          <a href={`tel:${phone}`} style={{display:"flex",alignItems:"center",gap:8,background:GL,borderRadius:10,padding:"10px 14px",textDecoration:"none"}}>
            <span style={{fontSize:20}}>📞</span>
            <div>
              <div style={{fontWeight:700,fontSize:13,color:G}}>Call Customer</div>
              <div style={{fontSize:12,color:"#6b6660"}}>{phone}</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("home");
  const [adminMode, setAdminMode] = useState(false);
  const [adminTab, setAdminTab] = useState("orders");
  const [cart, setCart] = useState(() => {
  const savedCart = localStorage.getItem("cart");
  return savedCart ? JSON.parse(savedCart) : {};
});
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [adminOrders, setAdminOrders] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [cat, setCat] = useState("All");
  const [search, setSearch] = useState("");
  const [checkoutStep, setCheckoutStep] = useState("cart");
  const [deliveryForm, setDeliveryForm] = useState(() => {
    // Pre-fill from saved location if available
    try {
      const loc = JSON.parse(localStorage.getItem("tk_location"));
      if (loc?.address) return {
        name: JSON.parse(localStorage.getItem("tk_user"))?.name || "",
        phone: JSON.parse(localStorage.getItem("tk_user"))?.phone || "",
        address: [loc.flatNo, loc.address, loc.landmark].filter(Boolean).join(", "),
        pincode: loc.pincode || "",
        note: ""
      };
    } catch {}
    return {name:"", phone:"", address:"", pincode:"", note:""};
  });
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [location, setLocation] = useState(() => { try { return JSON.parse(localStorage.getItem("tk_location")); } catch { return null; } });
  const [toast, setToast] = useState(null);
  const [toastColor, setToastColor] = useState("#1a1a1a");
  const [loading, setLoading] = useState(false);
  const [authView, setAuthView] = useState("login");
  const [authForm, setAuthForm] = useState({name:"",phone:"",password:"",adminSecret:""});
  const [token, setToken] = useState(() => localStorage.getItem("tk_token") || null);
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem("tk_user")); } catch { return null; } });
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [productSearch, setProductSearch] = useState("");
  const [riderMapOrder, setRiderMapOrder] = useState(null);
  const toastRef = useRef();

  useEffect(() => {
  localStorage.setItem("cart", JSON.stringify(cart));
}, [cart]);

  const showToast = (msg, color="#1a1a1a") => {
    setToast(msg); setToastColor(color);
    clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(null), 2500);
  };

  const saveAuth = (tok, usr) => {
    setToken(tok); setUser(usr);
    localStorage.setItem("tk_token", tok);
    localStorage.setItem("tk_user", JSON.stringify(usr));
    // Pre-fill delivery form name & phone
    setDeliveryForm(f => ({...f, name: f.name||usr.name||"", phone: f.phone||usr.phone||""}));
  };
  const logout = () => { setToken(null); setUser(null); localStorage.removeItem("tk_token"); localStorage.removeItem("tk_user"); setCart({}); setView("home"); showToast("Logged out"); };

  const saveLocation = (loc) => {
    setLocation(loc);
    localStorage.setItem("tk_location", JSON.stringify(loc));
    setShowLocationModal(false);
    showToast("Location saved ✓", G);
    setDeliveryForm(f => ({
      ...f,
      address: [loc.flatNo, loc.address, loc.landmark].filter(Boolean).join(", "),
      pincode: loc.pincode || f.pincode,
      name: f.name || user?.name || "",
      phone: f.phone || user?.phone || "",
    }));
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (cat !== "All") params.set("category", cat);
      if (search) params.set("search", search);
      const data = await apiFetch(`/products?${params}`);
      setProducts(data.products || []);
    } catch(e) { showToast("Failed to load products","#e53935"); }
    finally { setLoading(false); }
  }, [cat, search]);

  const fetchAllProducts = useCallback(async () => {
    try { const data = await apiFetch("/products?available=false",{},token); setProducts(data.products||[]); }
    catch(e) { showToast(e.message,"#e53935"); }
  }, [token]);

  useEffect(() => { if (!adminMode) fetchProducts(); }, [fetchProducts, adminMode]);
  useEffect(() => { if (adminMode && adminTab==="products") fetchAllProducts(); }, [adminMode, adminTab, fetchAllProducts]);

  const fetchMyOrders = useCallback(async () => {
    if (!token) return; setLoading(true);
    try { const d = await apiFetch("/orders/my",{},token); setOrders(d.orders||[]); }
    catch(e) { showToast(e.message,"#e53935"); } finally { setLoading(false); }
  }, [token]);
  useEffect(() => { if (view==="orders") fetchMyOrders(); }, [view, fetchMyOrders]);

  const fetchAdminData = useCallback(async () => {
    if (!token||user?.role!=="admin") return; setLoading(true);
    try {
      const [od,sd] = await Promise.all([apiFetch("/orders/admin/all",{},token), apiFetch("/orders/admin/stats",{},token)]);
      setAdminOrders(od.orders||[]); setAdminStats(sd.stats||null);
    } catch(e) { showToast(e.message,"#e53935"); } finally { setLoading(false); }
  }, [token, user]);

  // Poll for new orders every 30s when admin panel is open — alert on new ones
  const lastOrderCountRef = useRef(null);
  useEffect(() => {
    if (!adminMode || user?.role !== "admin") return;
    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    const poll = async () => {
      try {
        const od = await apiFetch("/orders/admin/all", {}, token);
        const orders = od.orders || [];
        const newCount = orders.length;
        if (lastOrderCountRef.current !== null && newCount > lastOrderCountRef.current) {
          const newest = orders[0];
          // Browser notification
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("🛒 New Trinkit Order!", {
              body: `${newest.customer?.name || "Customer"} placed an order — ₹${newest.pricing?.total}`,
              icon: "/favicon.ico",
            });
          }
          // In-app alert
          showToast(`🔔 New order from ${newest.customer?.name || "Customer"}!`, "#1a8c4e");
          // Play a sound
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
          } catch {}
          setAdminOrders(orders);
          setAdminStats(sd => sd ? {...sd, totalOrders: newCount} : sd);
        }
        lastOrderCountRef.current = newCount;
      } catch {}
    };
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, [adminMode, token, user]);
  useEffect(() => { if (adminMode && adminTab==="orders") fetchAdminData(); }, [adminMode, adminTab, fetchAdminData]);

  const cartCount = Object.values(cart).reduce((a,b)=>a+b,0);
  const cartTotal = Object.entries(cart).reduce((sum,[id,qty])=>{ const p=products.find(x=>x._id===id); return sum+(p?p.price*qty:0); },0);
  const deliveryFee = cartTotal >= 100 ? 0 : 40;
  const addToCart = (id) => { setCart(c=>({...c,[id]:(c[id]||0)+1})); showToast("Added to cart! 🛒",G); };
  const removeFromCart = (id) => { setCart(c=>{const n={...c}; if(n[id]>1)n[id]--; else delete n[id]; return n;}); };

  const handleAuth = async () => {
    setLoading(true);
    try {
      const endpoint = authView==="login" ? "/auth/login" : "/auth/register";
      const body = authView==="login"
        ? {phone:authForm.phone, password:authForm.password}
        : {name:authForm.name, phone:authForm.phone, password:authForm.password, ...(authForm.adminSecret?{adminSecret:authForm.adminSecret}:{})};
      const data = await apiFetch(endpoint, {method:"POST", body:JSON.stringify(body)});
      // If logging in with admin secret but account is customer role, upgrade it
      if (authView==="login" && authForm.adminSecret && data.user.role !== "admin") {
        try {
          const upgraded = await apiFetch("/auth/make-admin", {method:"POST", body:JSON.stringify({adminSecret:authForm.adminSecret})}, data.token);
          data.user = upgraded.user;
        } catch(e) { showToast("Invalid admin secret","#e53935"); setLoading(false); return; }
      }
      saveAuth(data.token, data.user);
      showToast(`Welcome, ${data.user.name}! 👋`, G);
      setView("home");
    } catch(e) { showToast(e.message,"#e53935"); } finally { setLoading(false); }
  };

  const placeCODOrder = async () => {
    setLoading(true);
    try {
      const items = Object.entries(cart).map(([productId,qty])=>({productId,qty}));
      const deliveryAddress = { ...deliveryForm, coords: location?.coords || null, flatNo: location?.flatNo || "", landmark: location?.landmark || "" };
      await apiFetch("/orders",{method:"POST",body:JSON.stringify({items,deliveryAddress,paymentMethod:"cod"})},token);
      setCart({}); setCheckoutStep("success");
    } catch(e) { showToast(e.message,"#e53935"); } finally { setLoading(false); }
  };

  const placeUPIOrder = async () => {
    setLoading(true);
    try {
      const items = Object.entries(cart).map(([productId,qty])=>({productId,qty}));
      const deliveryAddress = { ...deliveryForm, coords: location?.coords || null, flatNo: location?.flatNo || "", landmark: location?.landmark || "" };
      await apiFetch("/orders",{method:"POST",body:JSON.stringify({items,deliveryAddress,paymentMethod:"online"})},token);
      setCart({}); setShowUpiModal(false); setCheckoutStep("success");
    } catch(e) { showToast(e.message,"#e53935"); } finally { setLoading(false); }
  };

  const handlePayNow = () => { if (paymentMethod==="upi") setShowUpiModal(true); else placeCODOrder(); };

  const updateOrderStatus = async (id, status) => {
    try {
      await apiFetch(`/orders/admin/${id}/status`,{method:"PUT",body:JSON.stringify({status})},token);
      setAdminOrders(o=>o.map(ord=>ord._id===id?{...ord,status}:ord));
      showToast("Updated ✓",G);
    } catch(e) { showToast(e.message,"#e53935"); }
  };
  const deleteProduct = async (id) => {
    try { await apiFetch(`/products/${id}`,{method:"DELETE"},token); setProducts(p=>p.filter(x=>x._id!==id)); showToast("Deleted",G); }
    catch(e) { showToast(e.message,"#e53935"); } setConfirmDelete(null);
  };
  const toggleAvailability = async (product) => {
    try {
      const data = await apiFetch(`/products/${product._id}`,{method:"PUT",body:JSON.stringify({isAvailable:!product.isAvailable})},token);
      setProducts(p=>p.map(x=>x._id===product._id?data.product:x));
      showToast(`${data.product.isAvailable?"Visible":"Hidden"} ✓`,G);
    } catch(e) { showToast(e.message,"#e53935"); }
  };
  const onProductSaved = (product, isEdit) => {
    if (isEdit) setProducts(p=>p.map(x=>x._id===product._id?product:x));
    else setProducts(p=>[product,...p]);
  };
  const filteredAdminProducts = products.filter(p=>!productSearch||p.name.toLowerCase().includes(productSearch.toLowerCase())||p.category.toLowerCase().includes(productSearch.toLowerCase()));

  // Short display label for saved location
  const locLabel = location ? (location.flatNo ? `${location.flatNo}, ${location.address.split(",")[0]}` : location.address.split(",").slice(0,2).join(",")) : null;

  // ════════════════════════════════════════════════════════════════════════
  // ADMIN VIEW
  // ════════════════════════════════════════════════════════════════════════
  if (adminMode && user?.role==="admin") return (
    <div style={s.app}>
      <div style={s.adminBar}>
        <span style={{fontWeight:800,fontSize:18,color:"#fff"}}>⚙️ Trinkit Admin</span>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <span style={{background:G,color:"#fff",fontSize:10,padding:"3px 8px",borderRadius:6,fontWeight:700}}>ADMIN</span>
          <button onClick={()=>{
            if (!("Notification" in window)) { alert("Notifications not supported on this browser. Use Chrome."); return; }
            if (Notification.permission === "granted") { showToast("Notifications already enabled ✓", G); return; }
            if (Notification.permission === "denied") { alert("Notifications blocked. Go to browser Settings → Site Settings → Notifications → allow this site."); return; }
            Notification.requestPermission().then(p => { if(p==="granted") showToast("🔔 Order alerts enabled!", G); });
          }} style={{background: ("Notification" in window && Notification.permission==="granted") ? G : "#f57a00", color:"#fff", border:"none", padding:"5px 10px", borderRadius:6, fontSize:11, cursor:"pointer", fontWeight:700}}>
            {("Notification" in window && Notification.permission==="granted") ? "🔔 Alerts ON" : "🔔 Enable Alerts"}
          </button>
          <button onClick={()=>setAdminMode(false)} style={{background:"#333",color:"#fff",border:"none",padding:"5px 12px",borderRadius:6,fontSize:12,cursor:"pointer",fontWeight:600}}>← Exit</button>
        </div>
      </div>
      <div style={{padding:"16px 16px 0"}}>
        {adminStats&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            {[{v:adminStats.totalOrders,l:"Total Orders",icon:"📦"},{v:adminStats.activeOrders,l:"Active",icon:"🚀"},{v:"₹"+(adminStats.totalRevenue||0).toLocaleString(),l:"Revenue",icon:"💰"},{v:adminStats.todayOrders||0,l:"Today",icon:"📅"}].map(st=>(
              <div key={st.l} style={s.statCard}><div style={{fontSize:20,marginBottom:4}}>{st.icon}</div><div style={{fontWeight:800,fontSize:22,color:G}}>{st.v}</div><div style={{fontSize:11,color:"#6b6660",fontWeight:600,marginTop:2}}>{st.l}</div></div>
            ))}
          </div>
        )}
        <div style={{display:"flex",borderBottom:"2px solid #e4e0d8",marginBottom:16}}>
          {[["orders","📋 Orders"],["products","🛒 Products"]].map(([t,label])=>(
            <button key={t} onClick={()=>setAdminTab(t)} style={s.adminTab(adminTab===t)}>{label}</button>
          ))}
        </div>
        {adminTab==="orders"&&(loading?<Spinner/>:adminOrders.length===0?<EmptyState icon="📦" text="No orders yet"/>:
          adminOrders.map(o=>(
            <div key={o._id} style={s.adminCard}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <div>
                  <div style={{fontWeight:700,fontSize:14}}>{o.customer?.name||"Customer"}</div>
                  <div style={{fontSize:11,color:"#6b6660"}}>{o.orderId} • {o.customer?.phone}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <span style={s.statusBadge(o.status)}>{STATUS_LABELS[o.status]}</span>
                  <div style={{fontSize:10,marginTop:4,color:o.paymentMethod==="online"?G:"#f57a00",fontWeight:700}}>{o.paymentMethod==="online"?"📱 UPI":"💵 COD"}</div>
                </div>
              </div>
              {/* Delivery location if set */}
              {o.deliveryAddress?.address && (
                <div style={{fontSize:11,color:"#6b6660",marginBottom:6,display:"flex",gap:4,alignItems:"flex-start"}}>
                  <span>📍</span><span>{[o.deliveryAddress.flatNo,o.deliveryAddress.address].filter(Boolean).join(", ")}</span>
                </div>
              )}
              <div style={{fontSize:12,color:"#444",marginBottom:8,borderTop:"1px solid #f0ece4",paddingTop:8}}>{o.items.map(i=>`${i.name} ×${i.qty}`).join(" • ")}</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontWeight:800,color:G,fontSize:15}}>₹{o.pricing?.total}</span>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <button onClick={()=>setRiderMapOrder(o)} style={{background:"#e3f0ff",color:"#1565c0",border:"none",padding:"5px 10px",borderRadius:7,fontWeight:700,fontSize:12,cursor:"pointer"}}>📍 Map</button>
                  <select value={o.status} onChange={e=>updateOrderStatus(o._id,e.target.value)} style={{border:"1.5px solid #e4e0d8",borderRadius:8,padding:"5px 10px",fontSize:12,fontWeight:700,cursor:"pointer",background:"#fff",outline:"none"}}>
                    {["pending","confirmed","out","delivered","cancelled"].map(st=><option key={st} value={st}>{STATUS_LABELS[st]}</option>)}
                  </select>
                </div>
              </div>
            </div>
          ))
        )}
        {adminTab==="products"&&(
          <div>
            <div style={{display:"flex",gap:10,marginBottom:14}}>
              <div style={{...s.searchBox,flex:1}}><span>🔍</span><input style={s.searchInput} placeholder="Search..." value={productSearch} onChange={e=>setProductSearch(e.target.value)}/></div>
              <button onClick={()=>{setEditingProduct(null);setShowProductModal(true);}} style={{background:G,color:"#fff",border:"none",padding:"0 16px",borderRadius:12,fontWeight:800,fontSize:13,cursor:"pointer",whiteSpace:"nowrap"}}>＋ Add</button>
            </div>
            <div style={{fontSize:12,color:"#6b6660",marginBottom:10}}>{filteredAdminProducts.length} products</div>
            {filteredAdminProducts.length===0?<EmptyState icon="📦" text="No products" btnText="Add First Product" onBtn={()=>{setEditingProduct(null);setShowProductModal(true);}}/>:
              filteredAdminProducts.map(p=>(
                <div key={p._id} style={{...s.adminCard,opacity:p.isAvailable?1:.6}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:56,height:56,borderRadius:10,overflow:"hidden",flexShrink:0,background:"#f9f8f5",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {p.image?<img src={imgUrl(p.image)} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:28}}>{p.emoji||"🛒"}</span>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:14,marginBottom:2}}>{p.name}</div>
                      <div style={{fontSize:11,color:"#6b6660",marginBottom:4}}>{p.qty} • {p.category} • Stock: <b style={{color:p.stock<=5?"#e53935":G}}>{p.stock}</b></div>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <span style={{fontWeight:800,color:G,fontSize:15}}>₹{p.price}</span>
                        {p.mrp&&p.mrp>p.price&&<span style={{fontSize:11,color:"#aaa",textDecoration:"line-through"}}>₹{p.mrp}</span>}
                        {!p.isAvailable&&<span style={{fontSize:10,background:"#fce8e8",color:"#c62828",padding:"2px 6px",borderRadius:4,fontWeight:700}}>Hidden</span>}
                        {p.stock===0&&<span style={{fontSize:10,background:"#fce8e8",color:"#c62828",padding:"2px 6px",borderRadius:4,fontWeight:700}}>Out of stock</span>}
                        {p.stock>0&&p.stock<=5&&<span style={{fontSize:10,background:"#fff3e6",color:"#f57a00",padding:"2px 6px",borderRadius:4,fontWeight:700}}>Low stock</span>}
                      </div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:6,flexShrink:0}}>
                      <button onClick={()=>{setEditingProduct(p);setShowProductModal(true);}} style={{background:"#e3f0ff",color:"#1565c0",border:"none",padding:"6px 10px",borderRadius:7,fontWeight:700,fontSize:12,cursor:"pointer"}}>✏️ Edit</button>
                      <button onClick={()=>toggleAvailability(p)} style={{background:p.isAvailable?"#fff3e6":GL,color:p.isAvailable?"#f57a00":G,border:"none",padding:"6px 10px",borderRadius:7,fontWeight:700,fontSize:12,cursor:"pointer"}}>{p.isAvailable?"🙈 Hide":"👁 Show"}</button>
                      <button onClick={()=>setConfirmDelete(p)} style={{background:"#fce8e8",color:"#c62828",border:"none",padding:"6px 10px",borderRadius:7,fontWeight:700,fontSize:12,cursor:"pointer"}}>🗑 Del</button>
                    </div>
                  </div>
                </div>
              ))
            }
            <div style={{height:24}}/>
          </div>
        )}
      </div>
      {showProductModal&&<ProductModal product={editingProduct} token={token} onClose={()=>{setShowProductModal(false);setEditingProduct(null);}} onSaved={onProductSaved} showToast={showToast}/>}
      {confirmDelete&&<ConfirmDialog message={`Delete "${confirmDelete.name}"?`} onConfirm={()=>deleteProduct(confirmDelete._id)} onCancel={()=>setConfirmDelete(null)}/>}
      {riderMapOrder&&<RiderMapModal order={riderMapOrder} onClose={()=>setRiderMapOrder(null)}/>}
      {toast&&<div style={s.toast(toastColor)}>{toast}</div>}
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════
  // AUTH VIEW
  // ════════════════════════════════════════════════════════════════════════
  if (view==="auth") return (
    <div style={s.app}>
      <div style={s.topbar}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={s.brand}>Trin<span style={s.brandSpan}>kit</span></div>
          <button onClick={()=>setView("home")} style={{background:"none",border:"none",fontSize:20,cursor:"pointer"}}>✕</button>
        </div>
      </div>
      <div style={s.authCard}>
        <div style={{fontWeight:800,fontSize:20,marginBottom:4}}>{authView==="login"?"Welcome back 👋":"Create account"}</div>
        <div style={{fontSize:13,color:"#6b6660",marginBottom:20}}>{authView==="login"?"Login to your Trinkit account":"Sign up to start ordering"}</div>
        {authView==="register"&&<div style={s.formGroup}><label style={s.formLabel}>Full Name</label><input style={s.formInput} placeholder="Rakesh Sharma" value={authForm.name} onChange={e=>setAuthForm(f=>({...f,name:e.target.value}))}/></div>}
        <div style={s.formGroup}><label style={s.formLabel}>Phone Number</label><input style={s.formInput} placeholder="9876543210" type="tel" value={authForm.phone} onChange={e=>setAuthForm(f=>({...f,phone:e.target.value}))}/></div>
        <div style={s.formGroup}><label style={s.formLabel}>Password</label><input style={s.formInput} placeholder="Min 6 characters" type="password" value={authForm.password} onChange={e=>setAuthForm(f=>({...f,password:e.target.value}))}/></div>
        {authView==="register"&&<div style={s.formGroup}><label style={s.formLabel}>Admin Secret (optional)</label><input style={s.formInput} placeholder="Leave blank for customer account" value={authForm.adminSecret} onChange={e=>setAuthForm(f=>({...f,adminSecret:e.target.value}))}/></div>}
        {authView==="login"&&<div style={s.formGroup}><label style={s.formLabel}>Admin Secret (optional)</label><input style={s.formInput} placeholder="Only if you are the admin" value={authForm.adminSecret} onChange={e=>setAuthForm(f=>({...f,adminSecret:e.target.value}))}/></div>}
        <button style={s.primaryBtn} onClick={handleAuth} disabled={loading}>{loading?"Please wait...":authView==="login"?"Login":"Create Account"}</button>
        <div style={{textAlign:"center",marginTop:16,fontSize:13,color:"#6b6660"}}>
          {authView==="login"?"New here? ":"Already have an account? "}
          <span style={{color:G,fontWeight:700,cursor:"pointer"}} onClick={()=>setAuthView(authView==="login"?"register":"login")}>{authView==="login"?"Create account":"Login"}</span>
        </div>
      </div>
      {toast&&<div style={s.toast(toastColor)}>{toast}</div>}
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════
  // HOME VIEW
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div style={s.app}>
      {/* TOPBAR */}
      <div style={s.topbar}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={s.brand}>Trin<span style={s.brandSpan}>kit</span></div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {user?(<>
              {user.role==="admin"&&<button onClick={()=>{setAdminMode(true);setAdminTab("orders");}} style={{background:"#1a1a1a",color:"#fff",border:"none",padding:"5px 12px",borderRadius:6,fontSize:11,fontWeight:700,cursor:"pointer"}}>⚙️ Admin</button>}
              <button onClick={logout} style={{background:"none",border:"1px solid #e4e0d8",padding:"5px 10px",borderRadius:6,fontSize:11,fontWeight:700,cursor:"pointer",color:"#6b6660"}}>Logout</button>
            </>):<button onClick={()=>setView("auth")} style={{...s.addBtn,padding:"6px 14px",borderRadius:8,fontSize:12}}>Login</button>}
            <button style={s.iconBtn} onClick={()=>{setView("cart");setCheckoutStep("cart");}}>
              🛒{cartCount>0&&<span style={s.badge}>{cartCount}</span>}
            </button>
          </div>
        </div>
        {/* Location bar */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={s.locBar} onClick={()=>setShowLocationModal(true)}>
            <span style={{fontSize:16,color:G,flexShrink:0}}>📍</span>
            <div style={{minWidth:0}}>
              <div style={s.locText}>{locLabel || "Set delivery location"}</div>
              {location && <div style={s.locSub}>{location.type||""} • Tap to change</div>}
              {!location && <div style={s.locSub}>Tap to set your address</div>}
            </div>
            <span style={{fontSize:14,color:"#aaa",flexShrink:0,marginLeft:4}}>▾</span>
          </div>
          <div style={{fontSize:11,color:G,fontWeight:700,flexShrink:0,marginLeft:8}}>30–45 min</div>
        </div>
      </div>

      {view==="cart"?<CartView
        checkoutStep={checkoutStep} setCheckoutStep={setCheckoutStep}
        paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
        deliveryForm={deliveryForm} setDeliveryForm={setDeliveryForm}
        cart={cart} products={products} cartCount={cartCount} cartTotal={cartTotal} deliveryFee={deliveryFee}
        token={token} loading={loading} location={location} locLabel={locLabel}
        setView={setView} setShowLocationModal={setShowLocationModal}
        setShowUpiModal={setShowUpiModal} handlePayNow={handlePayNow}
        addToCart={addToCart} removeFromCart={removeFromCart}
        showToast={showToast}
      />:view==="orders"?<OrdersView
        orders={orders} token={token} loading={loading} setView={setView}
      />:(
        <div>
          <div style={s.searchWrap}>
            <div style={s.searchBox}><span style={{color:"#6b6660"}}>🔍</span><input style={s.searchInput} placeholder="Search groceries..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
          </div>
          {!search&&(
            <div style={{margin:"0 16px 16px",background:`linear-gradient(120deg,${G},${GD})`,borderRadius:14,padding:18,color:"#fff",position:"relative",overflow:"hidden"}}>
              <div style={{fontWeight:800,fontSize:20,marginBottom:4}}>Fresh Groceries</div>
              <p style={{fontSize:13,opacity:.85,marginBottom:12}}>Delivered to your door in 30–45 mins</p>
              <button style={{background:"#fff",color:G,border:"none",padding:"7px 16px",borderRadius:8,fontWeight:700,fontSize:13,cursor:"pointer"}} onClick={()=>setCat("Vegetables")}>Shop Now</button>
              <div style={{position:"absolute",right:16,top:"50%",transform:"translateY(-50%)",fontSize:52,opacity:.2}}>🛒</div>
            </div>
          )}
          {!search&&(
            <div style={{marginBottom:14}}>
              <div style={s.sectionTitle}>Categories</div>
              <div style={s.categories}>
                {CATS.map(c=>(
                  <div key={c} style={s.catChip(cat===c)} onClick={()=>setCat(c)}>
                    <span style={{fontSize:22}}>{CAT_ICONS[c]}</span>
                    <span style={{fontSize:11,fontWeight:700,color:cat===c?G:"#6b6660",textAlign:"center"}}>{c}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={s.sectionTitle}>{search?"Results":cat==="All"?"All Products":cat}</div>
          {loading?<Spinner/>:(
            <div style={s.productsGrid}>
              {products.length===0?<div style={{gridColumn:"1/-1",textAlign:"center",padding:32,color:"#6b6660"}}><div style={{fontSize:36,marginBottom:8}}>😕</div><p>No products found</p></div>:
                products.map(p=>(
                  <div key={p._id} style={s.productCard}>
                    {p.image?<img src={imgUrl(p.image)} alt={p.name} style={{width:"100%",height:110,objectFit:"cover",display:"block"}} onError={e=>{e.target.style.display="none";e.target.nextSibling.style.display="flex";}}/>:null}
                    <div style={{...s.productImgFallback,display:p.image?"none":"flex"}}>{p.emoji||"🛒"}</div>
                    <div style={s.productInfo}>
                      <div style={{fontSize:13,fontWeight:600,marginBottom:2,lineHeight:1.3}}>{p.name}</div>
                      <div style={{fontSize:11,color:"#6b6660",marginBottom:8}}>
                        {p.qty}{p.mrp&&p.mrp>p.price&&<span style={{marginLeft:6,background:GL,color:G,fontSize:10,fontWeight:700,padding:"1px 5px",borderRadius:4}}>{Math.round((p.mrp-p.price)/p.mrp*100)}% off</span>}
                      </div>
                      <div style={s.productFooter}>
                        <div>
                          <span style={{fontWeight:700,fontSize:15,color:G}}>₹{p.price}</span>
                          {p.mrp&&p.mrp>p.price&&<span style={{fontSize:11,color:"#aaa",textDecoration:"line-through",marginLeft:4}}>₹{p.mrp}</span>}
                        </div>
                        {p.stock===0?<span style={{fontSize:11,color:"#e53935",fontWeight:700}}>Out of stock</span>:
                          cart[p._id]?(
                            <div style={s.qtyCtrl}>
                              <button style={s.qtyBtn} onClick={()=>removeFromCart(p._id)}>-</button>
                              <span style={{fontWeight:700,fontSize:14,minWidth:18,textAlign:"center"}}>{cart[p._id]}</span>
                              <button style={s.qtyBtn} onClick={()=>addToCart(p._id)}>+</button>
                            </div>
                          ):<button style={s.addBtn} onClick={()=>addToCart(p._id)}>Add</button>
                        }
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          )}
        </div>
      )}

      <div style={s.bottomNav}>
        {[["home","🏪","Home"],["cart","🛒","Cart"],["orders","📦","Orders"]].map(([v,icon,label])=>(
          <button key={v} style={s.navItem(view===v)} onClick={()=>{setView(v);if(v==="cart")setCheckoutStep("cart");}}>
            <span style={{fontSize:20,position:"relative"}}>{icon}{v==="cart"&&cartCount>0&&<span style={{...s.badge,top:-4,right:-4}}>{cartCount}</span>}</span>
            <span>{label}</span>
          </button>
        ))}
        <button style={s.navItem(view==="auth")} onClick={()=>user?logout():setView("auth")}>
          <span style={{fontSize:20}}>{user?"👤":"🔐"}</span>
          <span>{user?"Profile":"Login"}</span>
        </button>
      </div>

      {showLocationModal&&<LocationModal onSave={saveLocation} onClose={()=>setShowLocationModal(false)} currentLocation={location}/>}
      {showUpiModal&&<UpiPaymentModal amount={cartTotal+deliveryFee} onPaid={placeUPIOrder} onCancel={()=>setShowUpiModal(false)}/>}
      {toast&&<div style={s.toast(toastColor)}>{toast}</div>}
    </div>
  );
}