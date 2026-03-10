import { createContext, useContext, useState } from "react";

const SignupContext = createContext(null);

export const useSignup = () => {
  const ctx = useContext(SignupContext);
  if (!ctx) throw new Error("useSignup must be used within SignupProvider");
  return ctx;
};

const initialData = {
  fullName: "",
  email: "",
  password: "",
  userName: "",
  avatarFile: null,
  coverFile: null,
};

const loadSaved = () => {
  try {
    const saved = sessionStorage.getItem("pv_signup");
    return saved ? { ...initialData, ...JSON.parse(saved) } : { ...initialData };
  } catch {
    return { ...initialData };
  }
};

export const SignupProvider = ({ children }) => {
  const [signupData, setSignupData] = useState(loadSaved);

  const updateSignup = (partial) => {
    setSignupData((prev) => {
      const next = { ...prev, ...partial };
      // persist text fields only (files can't be serialised)
      const { avatarFile, coverFile, ...saveable } = next;
      try { sessionStorage.setItem("pv_signup", JSON.stringify(saveable)); } catch {}
      return next;
    });
  };

  const resetSignup = () => {
    sessionStorage.removeItem("pv_signup");
    setSignupData({ ...initialData });
  };

  return (
    <SignupContext.Provider value={{ signupData, updateSignup, resetSignup }}>
      {children}
    </SignupContext.Provider>
  );
};
