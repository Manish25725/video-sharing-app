import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSignup } from "../contexts/SignupContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { UploadCloud, ImagePlus, Play, ArrowLeft, X } from "lucide-react";

const StepIndicator = ({ current, total }) => (
  <div className="flex items-center gap-3 mb-8">
    {Array.from({ length: total }, (_, i) => (
      <div key={i} className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all
          ${i + 1 === current ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : ""}
          ${i + 1 < current ? "bg-indigo-100 text-indigo-600" : ""}
          ${i + 1 > current ? "bg-gray-100 text-gray-400" : ""}`}>
          {i + 1 < current ? "✓" : i + 1}
        </div>
        {i < total - 1 && (
          <div className={`flex-1 h-0.5 w-8 rounded-full ${i + 1 < current ? "bg-indigo-400" : "bg-gray-200"}`} />
        )}
      </div>
    ))}
    <span className="ml-1 text-xs font-medium text-gray-400">Step {current} of {total}</span>
  </div>
);

const UploadCover = () => {
  const { signupData, updateSignup, resetSignup } = useSignup();
  const { register, login } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [preview, setPreview] = useState(
    signupData.coverFile ? URL.createObjectURL(signupData.coverFile) : null
  );
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select an image file."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("Image must be smaller than 10 MB."); return; }
    setError("");
    setPreview(URL.createObjectURL(file));
    updateSignup({ coverFile: file });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleFinish = async () => {
    if (!signupData.coverFile) { setError("Please upload a cover image."); return; }
    setLoading(true);
    setError("");

    const registerResult = await register(
      {
        fullName: signupData.fullName,
        email: signupData.email,
        password: signupData.password,
        userName: signupData.userName,
      },
      signupData.avatarFile,
      signupData.coverFile
    );
    if (!registerResult.success) {
      setError(registerResult.error || "Registration failed. Please try again.");
      setLoading(false);
      return;
    }

    // Auto-login after successful registration
    const loginResult = await login(signupData.email, signupData.password);
    resetSignup();
    if (loginResult.success) {
      navigate("/");
    } else {
      // Registration succeeded but auto-login failed — send to login page
      navigate("/login");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 flex items-center justify-center shadow-md">
            <Play className="w-4 h-4 text-white fill-current" />
          </div>
          <span className="font-bold text-xl text-gray-900">PlayVibe</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <StepIndicator current={4} total={4} />

          <h2 className="text-xl font-bold text-gray-900 mb-1">Add a cover photo</h2>
          <p className="text-sm text-gray-500 mb-6">Personalise your channel with a banner image</p>

          {/* Upload area — wider/landscape */}
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden h-44
              ${dragging ? "border-indigo-400 bg-indigo-50 scale-[1.01]" : "border-gray-300 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/40"}`}>

            {preview ? (
              <>
                <img src={preview} alt="Cover preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <p className="text-white text-sm font-medium">Click to change</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setPreview(null); updateSignup({ coverFile: null }); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors">
                  <X className="w-4 h-4 text-white" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center">
                  <ImagePlus className="w-7 h-7 text-indigo-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">Drag & drop or click to upload</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10 MB — recommended 1280×360px</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-1.5 border border-indigo-200 rounded-full text-indigo-600 text-xs font-medium hover:bg-indigo-50 transition-colors">
                  <UploadCloud className="w-3.5 h-3.5" />
                  Browse files
                </div>
              </div>
            )}
          </div>

          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />

          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 mt-6">
            <button onClick={() => navigate("/upload-avatar")} disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={handleFinish} disabled={loading}
              className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:scale-[0.99] text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : "Create account 🎉"}
            </button>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">Your data is securely transmitted and stored.</p>
      </div>
    </div>
  );
};

export default UploadCover;
