import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import {
  User, Camera, ImagePlus, Lock, Eye, EyeOff, Save, ArrowLeft,
  CheckCircle, AlertTriangle, X, Upload, Shield, Smartphone,
  Trash2, Mail, Calendar, ChevronRight, MonitorSmartphone,
  Clock, LogOut, ShieldCheck, ShieldOff, RefreshCw
} from "lucide-react";
import api from "../services/api.js";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "account", label: "Account", icon: ShieldCheck },
];

/* â”€â”€â”€ Toast â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const Toast = ({ msg, type, onClose }) => (
  <div ;

export default ProfileSettings;