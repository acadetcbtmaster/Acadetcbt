import React, { useState, useEffect, useRef } from 'react';
import brandLogo from '../assets/images/exact_acadet_cbt_logo_1786225425882.jpg';
import { UserProfile, UserRole, FUAHSE_DEPARTMENTS, FUL_DEPARTMENTS, COMMON_UNIVERSITY_DEPARTMENTS, University, FacultyGroup } from '../types';
import { StorageService, safeStringify } from '../services/storage';
import { ApiClient } from '../services/apiClient';
import {
  auth,
  googleProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from '../lib/firebase';
import {
  X,
  Mail,
  Lock,
  User,
  UserCheck,
  Phone,
  GraduationCap,
  Shield,
  CheckCircle2,
  AlertCircle,
  Building2,
  BookOpen,
  ArrowRight,
  Loader2,
  KeyRound,
  ArrowLeft,
  ShieldCheck,
  Eye,
  EyeOff,
  Share2,
  Ticket,
  Search,
  ChevronDown,
  MapPin,
  Check,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'register' | 'login' | 'admin' | 'forgot';
  onClose: () => void;
  onLoginSuccess: (user: UserProfile, message?: string) => void;
  universities?: { id: string; name: string }[];
  departments?: { id: string; name: string }[];
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'register',
  onClose,
  onLoginSuccess,
  universities: propUniversities,
}) => {
  const [mode, setMode] = useState<'register' | 'login' | 'admin' | 'forgot'>(initialMode);
  const [role, setRole] = useState<UserRole>('student');

  // Input Field Refs for Auto-Focusing First Error Field
  const fullNameRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const passwordHintRef = useRef<HTMLInputElement>(null);
  const universityRef = useRef<HTMLSelectElement>(null);
  const departmentRef = useRef<HTMLSelectElement>(null);
  const loginEmailRef = useRef<HTMLInputElement>(null);
  const loginPasswordRef = useRef<HTMLInputElement>(null);

  // Sign Up Form Fields State
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordHint, setPasswordHint] = useState('');

  // University & Department Selection
  const [selectedUniversity, setSelectedUniversity] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [uniSearchQuery, setUniSearchQuery] = useState<string>('');
  const [isUniDropdownOpen, setIsUniDropdownOpen] = useState<boolean>(false);
  const uniDropdownRef = useRef<HTMLDivElement>(null);

  // Categorized Faculty Groups & Department Search State
  const [facultyGroups, setFacultyGroups] = useState<FacultyGroup[]>([]);
  const [deptSearchQuery, setDeptSearchQuery] = useState<string>('');
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState<boolean>(false);
  const deptDropdownRef = useRef<HTMLDivElement>(null);
  const termsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFacultyGroups(StorageService.getSignupFacultyGroups());
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (uniDropdownRef.current && !uniDropdownRef.current.contains(event.target as Node)) {
        setIsUniDropdownOpen(false);
      }
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(event.target as Node)) {
        setIsDeptDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const allUniversities = React.useMemo<University[]>(() => {
    const fetched = propUniversities && propUniversities.length > 0
      ? (propUniversities as University[])
      : StorageService.getUniversities();
    return [...fetched].sort((a, b) => a.name.localeCompare(b.name));
  }, [propUniversities]);

  const filteredUniversities = React.useMemo(() => {
    if (!uniSearchQuery.trim()) return allUniversities;
    const q = uniSearchQuery.toLowerCase().trim();
    return allUniversities.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        (u.abbreviation && u.abbreviation.toLowerCase().includes(q)) ||
        (u.location && u.location.toLowerCase().includes(q))
    );
  }, [allUniversities, uniSearchQuery]);

  const selectedUniObj = React.useMemo(() => {
    if (!selectedUniversity) return null;
    return allUniversities.find(
      (u) => u.id === selectedUniversity || u.name === selectedUniversity
    ) || null;
  }, [allUniversities, selectedUniversity]);

  // Filtered Faculty Groups based on user search query
  const filteredFacultyGroups = React.useMemo(() => {
    const q = deptSearchQuery.toLowerCase().trim();
    if (!q) return facultyGroups;

    return facultyGroups
      .map((fac) => {
        const facNameMatches = fac.name.toLowerCase().includes(q);
        const matchingDepts = fac.departments.filter((d) => d.toLowerCase().includes(q));

        if (facNameMatches) return fac;
        if (matchingDepts.length > 0) {
          return {
            ...fac,
            departments: matchingDepts,
          };
        }
        return null;
      })
      .filter((f): f is FacultyGroup => f !== null);
  }, [facultyGroups, deptSearchQuery]);

  // Faculty name of selected department
  const selectedDeptFaculty = React.useMemo(() => {
    if (!selectedDepartment) return null;
    for (const fg of facultyGroups) {
      if (fg.departments.some((d) => d.toLowerCase() === selectedDepartment.toLowerCase())) {
        return fg.name;
      }
    }
    return null;
  }, [facultyGroups, selectedDepartment]);

  // Terms & Privacy Checkboxes
  const [agreeTerms, setAgreeTerms] = useState<boolean>(true);
  const [agreePrivacy, setAgreePrivacy] = useState<boolean>(true);

  // Student Login Mode State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Admin Login State
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);
  const [isAdminSubmitting, setIsAdminSubmitting] = useState(false);

  // Form Submission & Banner Notifications
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [topBannerError, setTopBannerError] = useState<string | null>(null);
  const [topBannerSuccess, setTopBannerSuccess] = useState<string | null>(null);

  // Touched Fields Tracking
  const [regTouched, setRegTouched] = useState<Record<string, boolean>>({});
  const [loginTouched, setLoginTouched] = useState<Record<string, boolean>>({});

  // Google Sign-In Loading & Fallback Modal State
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showGoogleFallbackModal, setShowGoogleFallbackModal] = useState(false);
  const [googleFallbackEmail, setGoogleFallbackEmail] = useState('');
  const [googleFallbackName, setGoogleFallbackName] = useState('');

  // Password Hint Recovery System State
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotHint, setForgotHint] = useState('');
  const [forgotStep, setForgotStep] = useState<'verify' | 'reset'>('verify');
  const [verifiedUser, setVerifiedUser] = useState<UserProfile | null>(null);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [recoverySuccess, setRecoverySuccess] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmNewPass, setShowConfirmNewPass] = useState(false);
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode || 'register');
      setTopBannerError(null);
      setTopBannerSuccess(null);
      setRegTouched({});
      setLoginTouched({});
      setForgotEmail('');
      setForgotHint('');
      setForgotStep('verify');
      setVerifiedUser(null);
      setRecoveryError(null);
      setRecoverySuccess(null);
      setNewPassword('');
      setConfirmNewPassword('');
      setShowCurrentPass(false);
      setShowNewPass(false);
      setShowConfirmNewPass(false);
      setIsVerifying(false);
      setIsUpdatingPass(false);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  // Retrieve existing users to validate unique username & email
  const existingUsers = StorageService.getUsers();

  // Helper function to map raw technical Firebase auth codes into friendly user messages
  const getFriendlyAuthError = (err: any): string => {
    if (!err) return 'An unexpected error occurred. Please try again.';
    const code = err.code || '';
    const msg = err.message || '';

    if (code === 'auth/user-not-found' || msg.includes('user-not-found')) {
      return 'No account was found with this email address or username.';
    }
    if (code === 'auth/wrong-password' || code === 'auth/invalid-credential' || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
      return 'The password you entered is incorrect.';
    }
    if (code === 'auth/email-already-in-use' || msg.includes('email-already-in-use')) {
      return 'This email address is already registered. Please sign in instead.';
    }
    if (code === 'auth/invalid-email' || msg.includes('invalid-email')) {
      return 'Please enter a valid email address.';
    }
    if (code === 'auth/weak-password' || msg.includes('weak-password')) {
      return 'Password must contain at least 8 characters.';
    }
    if (code === 'auth/user-disabled' || msg.includes('user-disabled')) {
      return 'Your account has been suspended. Please contact support.';
    }
    if (code === 'auth/too-many-requests' || msg.includes('too-many-requests')) {
      return 'Too many failed login attempts. Please try again later.';
    }
    if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
      return 'This preview domain is not authorized in Firebase Console. Local sign-in & registration remain fully active.';
    }
    if (code === 'auth/operation-not-allowed' || msg.includes('operation-not-allowed')) {
      return 'Email/Password authentication is disabled in Firebase Console. Local sign-in remains active.';
    }
    if (code === 'auth/popup-blocked' || msg.includes('popup-blocked')) {
      return 'Sign-in popup was blocked by browser. Please allow popups or use Email and Password sign in.';
    }
    if (code === 'auth/popup-closed-by-user' || msg.includes('popup-closed-by-user')) {
      return 'Sign-in popup was closed before completing authentication.';
    }
    if (code === 'auth/network-request-failed' || msg.includes('network-request-failed')) {
      return 'Network connection issue detected. Local sign-in & registration remain fully active.';
    }

    // Convert generic technical error strings
    if (msg.includes('Firebase') || msg.includes('stack') || msg.includes('Internal Server Error')) {
      return 'Unable to complete authentication. Local sign-in & registration remain active.';
    }

    return msg || 'Authentication failed. Please check your information and try again.';
  };

  // ==================== REAL-TIME REGISTRATION VALIDATION ====================
  const getRegistrationErrors = () => {
    const errors: Record<string, string> = {};

    // 1. Full Name
    if (!fullName.trim()) {
      errors.fullName = 'Full Name is required.';
    }

    // 2. Username
    if (!username.trim()) {
      errors.username = 'Username is required.';
    } else {
      const isTaken = existingUsers.some(
        (u) => u.username && u.username.toLowerCase() === username.trim().toLowerCase()
      );
      if (isTaken) {
        errors.username = 'This username is already in use.';
      }
    }

    // 3. Email Address
    if (!email.trim()) {
      errors.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    } else {
      const isTaken = existingUsers.some(
        (u) => u.email && u.email.toLowerCase() === email.trim().toLowerCase()
      );
      if (isTaken) {
        errors.email = 'This email address is already registered. Please sign in instead.';
      }
    }

    // 4. Phone Number (Removed requirement)
    // Phone number field removed for streamlined registration

    // 5. Password
    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 8) {
      errors.password = 'Password must contain at least 8 characters.';
    }

    // 6. Confirm Password
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    // 7. Password Hint (Mandatory)
    if (!passwordHint.trim()) {
      errors.passwordHint = 'Please enter your password hint.';
    }

    // 8. University
    if (!selectedUniversity) {
      errors.selectedUniversity = 'Please select your university.';
    }

    // 8. Department / Course
    if (!selectedDepartment) {
      errors.selectedDepartment = 'Please select your course.';
    }

    // 9. Terms & Privacy
    if (!agreeTerms || !agreePrivacy) {
      errors.terms = 'You must accept the Terms & Conditions and Privacy Policy.';
    }

    return errors;
  };

  const regErrors = getRegistrationErrors();

  // Helper to mark registration field touched on blur or change
  const touchRegField = (field: string) => {
    setRegTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Focus placement helper for registration errors
  const focusFirstRegError = (errors: Record<string, string>) => {
    if (errors.fullName) {
      fullNameRef.current?.focus();
    } else if (errors.username) {
      usernameRef.current?.focus();
    } else if (errors.email) {
      emailRef.current?.focus();
    } else if (errors.phone) {
      phoneRef.current?.focus();
    } else if (errors.password) {
      passwordRef.current?.focus();
    } else if (errors.confirmPassword) {
      confirmPasswordRef.current?.focus();
    } else if (errors.passwordHint) {
      passwordHintRef.current?.focus();
    } else if (errors.selectedUniversity) {
      setIsUniDropdownOpen(true);
      uniDropdownRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (errors.selectedDepartment) {
      setIsDeptDropdownOpen(true);
      deptDropdownRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (errors.terms) {
      termsContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // ==================== REAL-TIME LOGIN VALIDATION ====================
  const getLoginErrors = () => {
    const errors: Record<string, string> = {};

    if (!loginEmail.trim() && !loginPassword) {
      errors.loginEmail = 'Please enter your email address or username.';
      errors.loginPassword = 'Please enter your password.';
    } else {
      if (!loginEmail.trim()) {
        errors.loginEmail = 'Please enter your email address or username.';
      } else if (loginEmail.trim().length < 2) {
        errors.loginEmail = 'Please enter a valid email address or username.';
      }

      if (!loginPassword) {
        errors.loginPassword = 'Please enter your password.';
      }
    }

    return errors;
  };

  const loginErrors = getLoginErrors();

  const touchLoginField = (field: string) => {
    setLoginTouched((prev) => ({ ...prev, [field]: true }));
  };

  const focusFirstLoginError = (errors: Record<string, string>) => {
    if (errors.loginEmail) {
      loginEmailRef.current?.focus();
    } else if (errors.loginPassword) {
      loginPasswordRef.current?.focus();
    }
  };

  // ==================== REGISTRATION FORM SUBMIT ====================
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setTopBannerError(null);
    setTopBannerSuccess(null);

    // Mark all registration fields as touched
    const allTouched = {
      fullName: true,
      username: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
      passwordHint: true,
      selectedUniversity: true,
      selectedDepartment: true,
      terms: true,
    };
    setRegTouched(allTouched);

    const currentErrors = getRegistrationErrors();
    const errorKeys = Object.keys(currentErrors);

    if (errorKeys.length > 0) {
      const firstErrorMsg = currentErrors[errorKeys[0]];
      setTopBannerError(firstErrorMsg);
      focusFirstRegError(currentErrors);
      return;
    }

    // Check duplicate in local storage first
    const currentUsers = StorageService.getUsers();
    const duplicateEmail = currentUsers.find(
      (u) => u.email && u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (duplicateEmail) {
      setTopBannerError('This email address is already registered. Please sign in instead.');
      emailRef.current?.focus();
      return;
    }

    const duplicateUsername = currentUsers.find(
      (u) => u.username && u.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (duplicateUsername) {
      setTopBannerError('This username is already taken. Please choose another username.');
      usernameRef.current?.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Firebase Authentication Account Creation (with fallback for restricted/offline domains)
      let firebaseUid: string | null = null;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        firebaseUid = userCredential.user.uid;
        // Update Firebase auth display name
        await updateProfile(userCredential.user, { displayName: fullName.trim() });
      } catch (authErr: any) {
        const friendlyMsg = getFriendlyAuthError(authErr);
        const code = authErr?.code || '';
        const msg = authErr?.message || '';

        // If email is already taken in Firebase Auth
        if (friendlyMsg.toLowerCase().includes('already registered') || code === 'auth/email-already-in-use' || msg.includes('email-already-in-use')) {
          setTopBannerError('This email address is already registered. Please sign in instead.');
          setIsSubmitting(false);
          emailRef.current?.focus();
          return;
        }

        if (code === 'auth/weak-password' || msg.includes('weak-password')) {
          setTopBannerError('Password must contain at least 8 characters.');
          setIsSubmitting(false);
          passwordRef.current?.focus();
          return;
        }

        if (code === 'auth/invalid-email' || msg.includes('invalid-email')) {
          setTopBannerError('Please enter a valid email address.');
          setIsSubmitting(false);
          emailRef.current?.focus();
          return;
        }

        // For domain restriction (auth/unauthorized-domain), operation-not-allowed or network failure,
        // fallback gracefully to local registration so student can sign up seamlessly.
        console.warn('Firebase Auth notice during registration:', (authErr as any)?.message || String(authErr));
      }

      const newUserId = firebaseUid || `usr-${Date.now()}`;
      const uniName = selectedUniObj?.name || selectedUniversity || 'University of Lagos';
      const uniId = selectedUniObj?.id || (selectedUniversity ? `uni-${selectedUniversity.toLowerCase().replace(/\s+/g, '-')}` : 'uni-1');

      const newUser: UserProfile = {
        id: newUserId,
        name: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
        phone: phone.trim(),
        passwordHint: passwordHint.trim(),
        password: password,
        role: 'student',
        authProvider: 'Email',
        universityId: uniId,
        universityName: uniName,
        departmentId: `dept-${selectedDepartment.toLowerCase().replace(/\s+/g, '-')}`,
        departmentName: selectedDepartment,
        subscription: {
          isPremium: false,
          plan: '30-Question Free Tier',
          startDate: new Date().toISOString(),
          expiryDate: null,
          questionsAttemptedCount: 0,
          freeLimit: 30,
        },
        bookmarks: [],
        createdDate: new Date().toISOString(),
      };

      // Save user profile locally & push to Supabase via StorageService
      const freshUsers = StorageService.getUsers();
      StorageService.saveUsers([newUser, ...freshUsers.filter((u) => u.email !== newUser.email)]);
      StorageService.saveUser(newUser);

      // Success Actions
      const successMessage = "Your account has been created successfully.";
      setTopBannerSuccess(successMessage);

      setTimeout(() => {
        onLoginSuccess(newUser, successMessage);
        onClose();
      }, 800);
    } catch (err: any) {
      setTopBannerError(getFriendlyAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==================== STUDENT LOGIN FORM SUBMIT ====================
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setTopBannerError(null);
    setTopBannerSuccess(null);

    setLoginTouched({ loginEmail: true, loginPassword: true });

    const currentErrors = getLoginErrors();
    const errorKeys = Object.keys(currentErrors);

    if (errorKeys.length > 0) {
      const firstErrorMsg = currentErrors[errorKeys[0]];
      setTopBannerError(firstErrorMsg);
      focusFirstLoginError(currentErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const loginInput = loginEmail.trim();

      // Step 1: Check Local Storage for matching user by Email OR Username
      const currentUsers = StorageService.getUsers();
      let matched = currentUsers.find(
        (u) =>
          (u.email && u.email.toLowerCase() === loginInput.toLowerCase()) ||
          (u.username && u.username.toLowerCase() === loginInput.toLowerCase())
      );

      if (matched) {
        // Check account status
        if ((matched as any).status === 'suspended' || (matched as any).isSuspended) {
          setTopBannerError("Your account has been suspended. Please contact support.");
          setIsSubmitting(false);
          return;
        }
        if ((matched as any).status === 'deactivated' || (matched as any).isDeactivated) {
          setTopBannerError("This account is currently inactive.");
          setIsSubmitting(false);
          return;
        }
        if (matched.role === 'admin') {
          setTopBannerError("Students cannot log in using the Admin account. Please use Admin Login.");
          setIsSubmitting(false);
          return;
        }

        // Verify password if set locally
        if (matched.password) {
          if (matched.password === loginPassword) {
            StorageService.saveUser(matched);
            onLoginSuccess(matched, "Welcome back!");
            onClose();
            // Asynchronously sync Firebase Auth session if possible
            if (matched.email) {
              signInWithEmailAndPassword(auth, matched.email, loginPassword).catch(() => {});
            }
            return;
          } else {
            setTopBannerError("The password you entered is incorrect.");
            setIsSubmitting(false);
            loginPasswordRef.current?.focus();
            return;
          }
        }
      }

      // Step 2: If not verified locally or local account has no password, attempt Firebase Authentication
      const targetEmail = matched?.email || (loginInput.includes('@') ? loginInput : '');

      if (!targetEmail) {
        setTopBannerError("No account was found with this username. Please check your username or create an account.");
        setIsSubmitting(false);
        loginEmailRef.current?.focus();
        return;
      }

      try {
        await signInWithEmailAndPassword(auth, targetEmail, loginPassword);
      } catch (authErr: any) {
        const friendlyMsg = getFriendlyAuthError(authErr);
        const code = authErr?.code || '';
        const msg = authErr?.message || '';

        // If domain unauthorized, operation not allowed, or network failure in Firebase Auth console,
        // but user is attempting valid credentials, allow creating/logging into local session
        if (
          code === 'auth/unauthorized-domain' ||
          code === 'auth/operation-not-allowed' ||
          code === 'auth/network-request-failed' ||
          msg.includes('unauthorized-domain') ||
          msg.includes('network-request-failed')
        ) {
          const fallbackUser: UserProfile = matched || {
            id: `usr-${Date.now()}`,
            name: targetEmail.split('@')[0] || 'Student',
            email: targetEmail,
            password: loginPassword,
            role: 'student',
            authProvider: 'Email',
            universityId: 'uni-ful',
            universityName: 'Federal University Lokoja, Kogi State (FUL)',
            departmentId: 'dept-ful-1',
            departmentName: 'Computer Science',
            subscription: {
              isPremium: false,
              plan: '30-Question Free Tier',
              startDate: new Date().toISOString(),
              expiryDate: null,
              questionsAttemptedCount: 0,
              freeLimit: 30,
            },
            bookmarks: [],
            createdDate: new Date().toISOString(),
          };

          StorageService.saveUser(fallbackUser);
          onLoginSuccess(fallbackUser, "Welcome back!");
          onClose();
          return;
        }

        setTopBannerError(friendlyMsg);
        setIsSubmitting(false);

        if (friendlyMsg.includes('No account was found')) {
          loginEmailRef.current?.focus();
        } else if (friendlyMsg.includes('password you entered is incorrect')) {
          loginPasswordRef.current?.focus();
        }
        return;
      }

      const loginUser: UserProfile = matched || {
        id: auth.currentUser?.uid || `usr-${Date.now()}`,
        name: targetEmail.split('@')[0] || 'University Student',
        email: targetEmail,
        password: loginPassword,
        role: 'student',
        authProvider: 'Email',
        universityId: 'uni-ful',
        universityName: 'Federal University Lokoja, Kogi State (FUL)',
        departmentId: 'dept-ful-1',
        departmentName: 'Computer Science',
        subscription: {
          isPremium: false,
          plan: '30-Question Free Tier',
          startDate: new Date().toISOString(),
          expiryDate: null,
          questionsAttemptedCount: 0,
          freeLimit: 30,
        },
        bookmarks: [],
        createdDate: new Date().toISOString(),
      };

      StorageService.saveUser(loginUser);
      onLoginSuccess(loginUser, "Welcome back!");
      onClose();
    } catch (err: any) {
      setTopBannerError(getFriendlyAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==================== ADMIN LOGIN SUBMIT ====================
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError(null);
    setIsAdminSubmitting(true);

    try {
      const data = await ApiClient.adminLogin({
        username: adminUsername,
        password: adminPassword,
      });

      if (data.success) {
        if (data.token) {
          localStorage.setItem('cbt_admin_token', data.token);
        }
        
        const adminAccount = data.adminAccount || {
          id: data.adminUser?.id || 'adm-current',
          fullName: data.adminUser?.name || 'Administrator',
          username: adminUsername,
          email: data.adminUser?.email || 'admin@cbtmaster.ng',
          role: data.role || data.adminUser?.adminRole || 'Super Administrator',
          status: 'Active',
          createdDate: new Date().toISOString(),
          loginCount: 1,
        };

        StorageService.setCurrentAdmin(adminAccount);
        if (adminAccount.id) {
          localStorage.setItem('cbt_active_admin_id', adminAccount.id);
        }

        const adminUser: UserProfile = data.adminUser || {
          id: adminAccount.id,
          name: adminAccount.fullName,
          username: adminAccount.username,
          email: adminAccount.email,
          role: 'admin',
          adminRole: adminAccount.role,
          universityId: 'uni-ful',
          universityName: 'Federal University Lokoja, Kogi State (FUL)',
          departmentId: 'dept-ful-1',
          departmentName: 'Computer Science',
          subscription: {
            isPremium: true,
            plan: '30-Day Premium',
            startDate: new Date().toISOString(),
            expiryDate: null,
            questionsAttemptedCount: 0,
            freeLimit: 999999,
          },
          bookmarks: [],
          createdDate: adminAccount.createdDate || new Date().toISOString(),
        };

        StorageService.saveUser(adminUser);

        // Audit Log
        StorageService.logAdminAction({
          adminId: adminAccount.id,
          adminName: adminAccount.fullName,
          adminRole: adminAccount.role,
          action: 'Administrator Sign-In',
          module: 'Authentication System',
          details: `Admin ${adminAccount.username} (${adminAccount.role}) signed in successfully.`,
        });

        // Sync Admin Firebase Auth session in background if supported
        const adminEmail = adminAccount.email || 'admin@cbtmaster.ng';
        signInWithEmailAndPassword(auth, adminEmail, adminPassword)
          .catch(() => createUserWithEmailAndPassword(auth, adminEmail, adminPassword))
          .catch(() => {});

        onLoginSuccess(adminUser, `Welcome, ${adminAccount.fullName}! Logged in as ${adminAccount.role}.`);
        onClose();
      } else {
        setAdminAuthError(data.error || "Invalid administrator username or password.");
        setAdminPassword('');
      }
    } catch (err: any) {
      setAdminAuthError("Unable to reach authentication server. Please verify credentials.");
    } finally {
      setIsAdminSubmitting(false);
    }
  };

  // ==================== GOOGLE SIGN IN & FALLBACK SYSTEM ====================
  const processGoogleUserLogin = async (
    userEmail: string,
    userDisplayName: string,
    googleUid: string,
    userPhotoUrl?: string
  ) => {
    const currentUsers = StorageService.getUsers();
    let matchedUser = currentUsers.find(
      (u) => (u.email && u.email.toLowerCase() === userEmail.toLowerCase()) || u.googleUserId === googleUid
    );

    if (matchedUser) {
      matchedUser.photoUrl = userPhotoUrl || matchedUser.photoUrl;
      matchedUser.googleUserId = googleUid;
      matchedUser.authProvider = 'Google';

      StorageService.saveUser(matchedUser);
      onLoginSuccess(matchedUser, "Welcome back!");
    } else {
      const defaultUniObj = selectedUniObj || allUniversities[0];
      const defaultUniId = defaultUniObj?.id || 'uni-1';
      const defaultDept = selectedDepartment || 'Computer Science';
      const uniName = defaultUniObj?.name || selectedUniversity || 'Federal University Lokoja, Kogi State (FUL)';

      const newGoogleUser: UserProfile = {
        id: googleUid,
        name: userDisplayName,
        username: `goog_${googleUid.substring(0, 8)}`,
        email: userEmail,
        photoUrl: userPhotoUrl,
        googleUserId: googleUid,
        authProvider: 'Google',
        role: 'student',
        universityId: defaultUniId,
        universityName: uniName,
        departmentId: `dept-${defaultDept.toLowerCase().replace(/\s+/g, '-')}`,
        departmentName: defaultDept,
        subscription: {
          isPremium: false,
          plan: '30-Question Free Tier',
          startDate: new Date().toISOString(),
          expiryDate: null,
          questionsAttemptedCount: 0,
          freeLimit: 30,
        },
        bookmarks: [],
        createdDate: new Date().toISOString(),
      };

      StorageService.saveUsers([newGoogleUser, ...currentUsers]);
      StorageService.saveUser(newGoogleUser);

      onLoginSuccess(newGoogleUser, "Your Google account has been created successfully.");
    }

    onClose();
  };

  const handleGoogleSignIn = async () => {
    setTopBannerError(null);
    setIsGoogleLoading(true);

    try {
      // 1. Attempt standard Google Auth popup account selection
      const result = await signInWithPopup(auth, googleProvider);
      const gUser = result.user;

      if (gUser && gUser.email) {
        await processGoogleUserLogin(
          gUser.email,
          gUser.displayName || gUser.email.split('@')[0],
          gUser.uid,
          gUser.photoURL || 'https://lh3.googleusercontent.com/a/default-user'
        );
        return;
      }
    } catch (error: any) {
      console.warn('Google Sign-In Popup note:', error?.message || String(error));
      const code = error?.code || '';
      const msg = error?.message || '';

      // If user manually closed popup
      if (code === 'auth/popup-closed-by-user' || msg.includes('popup-closed-by-user')) {
        setTopBannerError('Google Sign-In was cancelled.');
        setIsGoogleLoading(false);
        return;
      }

      // 2. Fallback if iframe sandbox restricts OAuth popup or domain unauthorized
      const typedEmail = (mode === 'login' ? loginEmail : email).trim();
      const typedName = fullName.trim();

      if (typedEmail && typedEmail.includes('@')) {
        const googleUid = `goog_${typedEmail.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        await processGoogleUserLogin(
          typedEmail,
          typedName || typedEmail.split('@')[0],
          googleUid,
          'https://lh3.googleusercontent.com/a/default-user'
        );
      } else {
        setGoogleFallbackEmail(loginEmail || email || '');
        setGoogleFallbackName(fullName || '');
        setShowGoogleFallbackModal(true);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleConfirmGoogleFallback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleFallbackEmail || !googleFallbackEmail.includes('@')) {
      setTopBannerError('Please enter a valid Google email address.');
      return;
    }
    setIsGoogleLoading(true);
    const cleanEmail = googleFallbackEmail.trim().toLowerCase();
    const cleanName = googleFallbackName.trim() || cleanEmail.split('@')[0] || 'Google Student';
    const googleUid = `goog_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;

    try {
      await processGoogleUserLogin(
        cleanEmail,
        cleanName,
        googleUid,
        'https://lh3.googleusercontent.com/a/default-user'
      );
      setShowGoogleFallbackModal(false);
    } catch (err: any) {
      setTopBannerError('Failed to complete Google Sign In. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // ==================== PASSWORD HINT RECOVERY SYSTEM ====================
  const handleVerifyRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);
    setRecoverySuccess(null);

    const cleanEmail = forgotEmail.trim().toLowerCase();
    const cleanHint = forgotHint.trim().toLowerCase();

    if (!cleanEmail) {
      setRecoveryError('Please enter your email address.');
      return;
    }

    if (!cleanHint) {
      setRecoveryError('Please enter your password hint.');
      return;
    }

    setIsVerifying(true);

    try {
      // 1. Search Local Storage / StorageService users
      const currentUsers = StorageService.getUsers();
      let matched = currentUsers.find(
        (u) => u.email && u.email.trim().toLowerCase() === cleanEmail
      );

      if (!matched) {
        setRecoveryError('No account was found with this email address.');
        setIsVerifying(false);
        return;
      }

      const savedHint = (matched.passwordHint || '').trim().toLowerCase();
      if (!savedHint || savedHint !== cleanHint) {
        setRecoveryError('Incorrect password hint. Please enter the same password hint you created during registration.');
        setIsVerifying(false);
        return;
      }

      // Verification Passed!
      setVerifiedUser(matched);
      setForgotStep('reset');
      setRecoverySuccess('Identity Verified Successfully');
    } catch (err: any) {
      setRecoveryError(getFriendlyAuthError(err));
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);
    setRecoverySuccess(null);

    if (!newPassword) {
      setRecoveryError('Please enter your new password.');
      return;
    }

    if (newPassword.length < 8) {
      setRecoveryError('Please choose a stronger password.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setRecoveryError('Passwords do not match.');
      return;
    }

    setIsUpdatingPass(true);

    try {
      if (!verifiedUser) {
        setRecoveryError('Session expired. Please verify your identity again.');
        setForgotStep('verify');
        setIsUpdatingPass(false);
        return;
      }

      const updatedUser: UserProfile = {
        ...verifiedUser,
        password: newPassword,
      };

      // Update in StorageService (pushes to Supabase)
      const currentUsers = StorageService.getUsers();
      const updatedList = currentUsers.map((u) =>
        u.id === verifiedUser.id || (u.email && u.email.toLowerCase() === verifiedUser.email.toLowerCase())
          ? updatedUser
          : u
      );
      StorageService.saveUsers(updatedList);
      StorageService.saveUser(updatedUser);

      setRecoverySuccess('Password changed successfully.');

      setTimeout(() => {
        setMode('login');
        setLoginEmail(verifiedUser.email);
        setLoginPassword('');
        setForgotStep('verify');
        setVerifiedUser(null);
        setNewPassword('');
        setConfirmNewPassword('');
        setForgotHint('');
        setRecoverySuccess(null);
        setRecoveryError(null);
      }, 1500);
    } catch (err: any) {
      setRecoveryError(getFriendlyAuthError(err));
    } finally {
      setIsUpdatingPass(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div
        className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-5 sm:p-7 relative overflow-hidden max-h-[92vh] flex flex-col"
        id="auth-modal-box"
      >
        {/* Top Header Navigation Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0 mb-4 z-10" id="auth-modal-top-bar">
          {/* Top Left Back Arrow Button */}
          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white rounded-xl bg-slate-800/80 hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-bold border border-slate-700 cursor-pointer shadow-sm"
            id="auth-modal-back-btn"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4 text-indigo-400" />
            <span>Back</span>
          </button>

          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {mode === 'login' ? 'Sign In' : mode === 'register' ? 'Register' : mode === 'admin' ? 'Admin Access' : 'Account Recovery'}
          </span>

          {/* Top Right Cancel Button */}
          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white rounded-xl bg-slate-800/80 hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs font-bold border border-slate-700 cursor-pointer shadow-sm"
            id="auth-modal-close-btn"
            aria-label="Cancel / Close modal"
          >
            <span>Cancel</span>
            <X className="w-4 h-4 text-rose-400" />
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="overflow-y-auto pr-1 custom-scrollbar">
          
          {/* Header */}
          <div className="text-center mb-5 pt-1">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto mb-3 shadow-inner overflow-hidden">
              {mode === 'admin' ? (
                <Shield className="w-6 h-6 text-amber-400" />
              ) : (
                <img 
                  src={brandLogo} 
                  alt="Acadet CBT Logo" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer" 
                />
              )}
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {mode === 'register' && 'Create Your Account'}
              {mode === 'login' && 'Student Sign In'}
              {mode === 'admin' && 'Administrator Portal'}
              {mode === 'forgot' && 'Reset Password'}
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
              {mode === 'register' && 'Create your student account to start practicing CBT questions, track progress, and prepare for exams.'}
              {mode === 'login' && 'Sign in as a student to access CBT practice tests, track performance, and take mock exams.'}
              {mode === 'admin' && 'Secure administrator portal. Restricted access for system management.'}
              {mode === 'forgot' && 'Enter your email address and password hint to verify your identity and reset your password.'}
            </p>
          </div>

          {/* Mode Selector Tabs */}
          {mode !== 'forgot' && (
            <div className="grid grid-cols-3 p-1 bg-slate-950 rounded-xl border border-slate-800 mb-4" id="mode-selector-tab">
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setRole('student');
                  setTopBannerError(null);
                  setTopBannerSuccess(null);
                  setAdminAuthError(null);
                }}
                className={`py-2 text-[11px] font-semibold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  mode === 'register' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
                id="tab-register"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Sign Up
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setRole('student');
                  setTopBannerError(null);
                  setTopBannerSuccess(null);
                  setAdminAuthError(null);
                }}
                className={`py-2 text-[11px] font-semibold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  mode === 'login' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
                id="tab-student-login"
              >
                <User className="w-3.5 h-3.5" />
                Student Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('admin');
                  setRole('admin');
                  setTopBannerError(null);
                  setTopBannerSuccess(null);
                  setAdminAuthError(null);
                }}
                className={`py-2 text-[11px] font-semibold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  mode === 'admin' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
                id="tab-admin-login"
              >
                <Shield className="w-3.5 h-3.5" />
                Admin Login
              </button>
            </div>
          )}

          {/* Top Form Banner Notification */}
          {topBannerError && (
            <div className="mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl p-3 text-xs flex items-center gap-2.5 animate-in fade-in" id="auth-top-banner-error">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="font-medium leading-relaxed">{topBannerError}</span>
            </div>
          )}

          {topBannerSuccess && (
            <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl p-3 text-xs flex items-center gap-2.5 animate-in fade-in" id="auth-top-banner-success">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-medium leading-relaxed">{topBannerSuccess}</span>
            </div>
          )}

          {/* Mode: Forgot Password (Password Hint Recovery System) */}
          {mode === 'forgot' ? (
            <div className="space-y-4">
              {/* Recovery Banner Error */}
              {recoveryError && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl p-3 text-xs flex items-center gap-2.5 animate-in fade-in" id="auth-recovery-error">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="font-medium leading-relaxed">{recoveryError}</span>
                </div>
              )}

              {/* Recovery Banner Success */}
              {recoverySuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl p-3 text-xs flex items-center gap-2.5 animate-in fade-in" id="auth-recovery-success">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-medium leading-relaxed">{recoverySuccess}</span>
                </div>
              )}

              {forgotStep === 'verify' ? (
                /* Step 1: Verify Email & Password Hint */
                <form onSubmit={handleVerifyRecovery} className="space-y-4">
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <p className="leading-relaxed text-[11px]">
                      Enter your registered Email Address and Password Hint to verify your identity and recover your account instantly.
                    </p>
                  </div>

                  {/* Email Field */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Email Address <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        placeholder="Enter the email address used during registration."
                        value={forgotEmail}
                        onChange={(e) => {
                          setForgotEmail(e.target.value);
                          if (recoveryError) setRecoveryError(null);
                        }}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Password Hint Field */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Password Hint <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="Enter the password hint you created when registering."
                        value={forgotHint}
                        onChange={(e) => {
                          setForgotHint(e.target.value);
                          if (recoveryError) setRecoveryError(null);
                        }}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={isVerifying}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Verifying Identity...</span>
                        </>
                      ) : (
                        <span>Verify Identity</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-bold rounded-xl cursor-pointer transition-colors border border-slate-700"
                    >
                      Return to Sign In
                    </button>
                  </div>
                </form>
              ) : (
                /* Step 2: Display Current Password + Reset New Password */
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  {/* Verified Identity Badge */}
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3.5 text-emerald-300 text-xs flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/40">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white text-xs">Identity Verified Successfully</h4>
                      <p className="text-[11px] text-emerald-300/80 mt-0.5">
                        Matched account: <strong className="text-white">{verifiedUser?.name || verifiedUser?.email}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Current Password Field Display */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-400">Current Saved Password</label>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-indigo-300">
                        {showCurrentPass
                          ? verifiedUser?.password || '••••••••'
                          : '••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-medium px-2 py-1 rounded bg-slate-900 border border-slate-800 cursor-pointer"
                      >
                        {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{showCurrentPass ? 'Hide' : 'Reveal'}</span>
                      </button>
                    </div>
                  </div>

                  {/* New Password Input */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      New Password <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        required
                        placeholder="Enter new password (min 8 characters)"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (recoveryError) setRecoveryError(null);
                        }}
                        className="w-full pl-9 pr-9 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password Input */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Confirm New Password <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type={showConfirmNewPass ? 'text' : 'password'}
                        required
                        placeholder="Re-enter new password"
                        value={confirmNewPassword}
                        onChange={(e) => {
                          setConfirmNewPassword(e.target.value);
                          if (recoveryError) setRecoveryError(null);
                        }}
                        className="w-full pl-9 pr-9 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmNewPass(!showConfirmNewPass)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {showConfirmNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={isUpdatingPass}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isUpdatingPass ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Updating Password...</span>
                        </>
                      ) : (
                        <span>Change Password & Sign In</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setForgotStep('verify')}
                      className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-bold rounded-xl cursor-pointer transition-colors border border-slate-700"
                    >
                      Back
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : mode === 'admin' ? (
            /* Mode: Secure Admin Login */
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-amber-200 text-xs flex items-start gap-2.5">
                <KeyRound className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Admin login requires backend system authorization. Student accounts cannot log in here.
                </p>
              </div>

              {adminAuthError && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl p-3 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{adminAuthError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Administrator Username</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Enter Admin Username"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Administrator Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isAdminSubmitting || !adminUsername.trim() || !adminPassword.trim()}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isAdminSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>Authenticate Administrator</span>
                  </>
                )}
              </button>
            </form>
          ) : mode === 'login' ? (
            /* Mode: Student Login */
            <form onSubmit={handleStudentLogin} className="space-y-4" noValidate>
              
              {/* Login Email Address */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Student Email Address <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    ref={loginEmailRef}
                    type="email"
                    placeholder="student@university.edu.ng"
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      touchLoginField('loginEmail');
                      if (topBannerError) setTopBannerError(null);
                    }}
                    onBlur={() => touchLoginField('loginEmail')}
                    className={`w-full pl-9 pr-3 py-2.5 bg-slate-950 border rounded-xl text-xs text-slate-100 focus:outline-none transition-all ${
                      loginTouched.loginEmail && loginErrors.loginEmail
                        ? 'border-rose-500 bg-rose-500/5 focus:border-rose-500'
                        : 'border-slate-800 focus:border-indigo-500'
                    }`}
                  />
                </div>
                {loginTouched.loginEmail && loginErrors.loginEmail && (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{loginErrors.loginEmail}</span>
                  </p>
                )}
              </div>

              {/* Login Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300">
                    Password <span className="text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(loginEmail);
                      setMode('forgot');
                    }}
                    className="text-[11px] text-indigo-400 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    ref={loginPasswordRef}
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      touchLoginField('loginPassword');
                      if (topBannerError) setTopBannerError(null);
                    }}
                    onBlur={() => touchLoginField('loginPassword')}
                    className={`w-full pl-9 pr-3 py-2.5 bg-slate-950 border rounded-xl text-xs text-slate-100 focus:outline-none transition-all ${
                      loginTouched.loginPassword && loginErrors.loginPassword
                        ? 'border-rose-500 bg-rose-500/5 focus:border-rose-500'
                        : 'border-slate-800 focus:border-indigo-500'
                    }`}
                  />
                </div>
                {loginTouched.loginPassword && loginErrors.loginPassword && (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{loginErrors.loginPassword}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <span>Sign In as Student</span>
                )}
              </button>
            </form>
          ) : (
            /* Mode: Sign Up (Register) */
            <form onSubmit={handleRegister} className="space-y-3.5" noValidate>
              
              {/* Full Name */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    ref={fullNameRef}
                    type="text"
                    placeholder="e.g. Alex Johnson"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      touchRegField('fullName');
                      if (topBannerError) setTopBannerError(null);
                    }}
                    onBlur={() => touchRegField('fullName')}
                    className={`w-full pl-9 pr-3 py-2.5 bg-slate-950 border rounded-xl text-xs text-slate-100 focus:outline-none transition-all ${
                      regTouched.fullName && regErrors.fullName
                        ? 'border-rose-500 bg-rose-500/5 focus:border-rose-500'
                        : 'border-slate-800 focus:border-indigo-500'
                    }`}
                  />
                </div>
                {regTouched.fullName && regErrors.fullName && (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{regErrors.fullName}</span>
                  </p>
                )}
              </div>

              {/* Username (must be unique) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300">
                    Username (must be unique) <span className="text-rose-400">*</span>
                  </label>
                </div>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    ref={usernameRef}
                    type="text"
                    placeholder="e.g. alexj2026"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      touchRegField('username');
                      if (topBannerError) setTopBannerError(null);
                    }}
                    onBlur={() => touchRegField('username')}
                    className={`w-full pl-9 pr-3 py-2.5 bg-slate-950 border rounded-xl text-xs text-slate-100 focus:outline-none transition-all ${
                      regTouched.username && regErrors.username
                        ? 'border-rose-500 bg-rose-500/5 focus:border-rose-500'
                        : 'border-slate-800 focus:border-indigo-500'
                    }`}
                  />
                </div>
                {regTouched.username && regErrors.username && (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{regErrors.username}</span>
                  </p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300">
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    ref={emailRef}
                    type="email"
                    placeholder="e.g. student@university.edu.ng"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      touchRegField('email');
                      if (topBannerError) setTopBannerError(null);
                    }}
                    onBlur={() => touchRegField('email')}
                    className={`w-full pl-9 pr-3 py-2.5 bg-slate-950 border rounded-xl text-xs text-slate-100 focus:outline-none transition-all ${
                      regTouched.email && regErrors.email
                        ? 'border-rose-500 bg-rose-500/5 focus:border-rose-500'
                        : 'border-slate-800 focus:border-indigo-500'
                    }`}
                  />
                </div>
                {regTouched.email && regErrors.email && (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{regErrors.email}</span>
                  </p>
                )}
              </div>

              {/* Passwords (Password & Confirm Password) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      ref={passwordRef}
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        touchRegField('password');
                        if (topBannerError) setTopBannerError(null);
                      }}
                      onBlur={() => touchRegField('password')}
                      className={`w-full pl-9 pr-3 py-2.5 bg-slate-950 border rounded-xl text-xs text-slate-100 focus:outline-none transition-all ${
                        regTouched.password && regErrors.password
                          ? 'border-rose-500 bg-rose-500/5 focus:border-rose-500'
                          : 'border-slate-800 focus:border-indigo-500'
                      }`}
                    />
                  </div>
                  {regTouched.password && regErrors.password && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{regErrors.password}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Confirm Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      ref={confirmPasswordRef}
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        touchRegField('confirmPassword');
                        if (topBannerError) setTopBannerError(null);
                      }}
                      onBlur={() => touchRegField('confirmPassword')}
                      className={`w-full pl-9 pr-3 py-2.5 bg-slate-950 border rounded-xl text-xs text-slate-100 focus:outline-none transition-all ${
                        regTouched.confirmPassword && regErrors.confirmPassword
                          ? 'border-rose-500 bg-rose-500/5 focus:border-rose-500'
                          : 'border-slate-800 focus:border-indigo-500'
                      }`}
                    />
                  </div>
                  {regTouched.confirmPassword && regErrors.confirmPassword && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{regErrors.confirmPassword}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Password Hint Field (Mandatory) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300">
                    Password Hint <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[10px] text-indigo-400">Account Recovery</span>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    ref={passwordHintRef}
                    type="text"
                    placeholder="e.g. Favorite club: Arsenal, First school: Kings College"
                    value={passwordHint}
                    onChange={(e) => {
                      setPasswordHint(e.target.value);
                      touchRegField('passwordHint');
                      if (topBannerError) setTopBannerError(null);
                    }}
                    onBlur={() => touchRegField('passwordHint')}
                    className={`w-full pl-9 pr-3 py-2.5 bg-slate-950 border rounded-xl text-xs text-slate-100 focus:outline-none transition-all ${
                      regTouched.passwordHint && regErrors.passwordHint
                        ? 'border-rose-500 bg-rose-500/5 focus:border-rose-500'
                        : 'border-slate-800 focus:border-indigo-500'
                    }`}
                  />
                </div>
                
                {/* Quick Hint Suggestions */}
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-slate-400">Suggestions:</span>
                  {[
                    'Favorite Team',
                    'First School',
                    'Mother\'s Maiden Name',
                    'Childhood Pet',
                  ].map((hintText) => (
                    <button
                      key={hintText}
                      type="button"
                      onClick={() => {
                        setPasswordHint(`${hintText}: `);
                        touchRegField('passwordHint');
                        passwordHintRef.current?.focus();
                        if (topBannerError) setTopBannerError(null);
                      }}
                      className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] text-slate-300 hover:text-white hover:border-indigo-500/40 hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      + {hintText}
                    </button>
                  ))}
                </div>

                {regTouched.passwordHint && regErrors.passwordHint && (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{regErrors.passwordHint}</span>
                  </p>
                )}
              </div>

              {/* Select University with Searchable Selector */}
              <div className="relative" ref={uniDropdownRef}>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                  <span>
                    Choose Your University <span className="text-rose-400">*</span>
                  </span>
                  <span className="text-[10px] text-cyan-400 font-semibold bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-500/30">
                    {allUniversities.length} Universities (A-Z)
                  </span>
                </label>

                {/* University Picker Display Button */}
                <div
                  onClick={() => setIsUniDropdownOpen((prev) => !prev)}
                  className={`w-full min-h-[42px] px-3 py-2 bg-slate-950 border rounded-xl text-xs text-slate-200 cursor-pointer transition-all flex items-center justify-between ${
                    regTouched.selectedUniversity && regErrors.selectedUniversity
                      ? 'border-rose-500 bg-rose-500/5 focus:border-rose-500'
                      : isUniDropdownOpen
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden pr-2">
                    <Building2 className={`w-4 h-4 shrink-0 ${selectedUniObj ? 'text-cyan-400' : 'text-slate-500'}`} />
                    {selectedUniObj ? (
                      <div className="flex items-center gap-2 overflow-hidden text-left">
                        <span className="font-semibold text-white truncate text-xs">{selectedUniObj.name}</span>
                        {selectedUniObj.abbreviation && (
                          <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded shrink-0">
                            {selectedUniObj.abbreviation}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">Search or choose your university...</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {selectedUniversity && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUniversity('');
                          setSelectedDepartment('');
                          setUniSearchQuery('');
                        }}
                        className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                        title="Clear university selection"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isUniDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* University Search Popover & Dropdown */}
                {isUniDropdownOpen && (
                  <div className="absolute z-50 left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                    {/* Search Space Header */}
                    <div className="p-2.5 bg-slate-950/90 border-b border-slate-800 sticky top-0 z-10">
                      <div className="relative">
                        <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-2.5 pointer-events-none" />
                        <input
                          type="text"
                          value={uniSearchQuery}
                          onChange={(e) => setUniSearchQuery(e.target.value)}
                          placeholder="Search university by name, code (UNILAG, ABU, OAU) or state..."
                          className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                          autoFocus
                        />
                        {uniSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setUniSearchQuery('')}
                            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 px-1 font-medium">
                        <span>{filteredUniversities.length} universities available</span>
                        <span>Sorted A to Z</span>
                      </div>
                    </div>

                    {/* Scrollable Alphabetical University List */}
                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/40 p-1 custom-scrollbar">
                      {/* Option to use custom typed university if search has text */}
                      {uniSearchQuery.trim() && (
                        <div className="p-1.5 mb-1 bg-cyan-950/40 rounded-xl border border-cyan-500/30">
                          <button
                            type="button"
                            onClick={() => {
                              const customUni = uniSearchQuery.trim();
                              setSelectedUniversity(customUni);
                              setSelectedDepartment('');
                              setIsUniDropdownOpen(false);
                              setRegTouched((prev) => ({ ...prev, selectedUniversity: true }));
                              if (topBannerError) setTopBannerError(null);
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 hover:text-white transition-colors flex items-center justify-between group cursor-pointer"
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
                              <span className="text-xs font-semibold truncate">
                                Use &quot;{uniSearchQuery.trim()}&quot;
                              </span>
                            </div>
                            <span className="text-[10px] bg-cyan-500/30 text-cyan-200 px-1.5 py-0.5 rounded font-bold shrink-0">
                              Custom Institution
                            </span>
                          </button>
                        </div>
                      )}

                      {filteredUniversities.length === 0 ? (
                        <div className="py-6 text-center px-4">
                          <Building2 className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                          <p className="text-xs text-slate-300 font-medium">No pre-listed university found matching &quot;{uniSearchQuery}&quot;</p>
                          <p className="text-[11px] text-slate-400 mt-1">Click the button above to use your typed institution name.</p>
                        </div>
                      ) : (
                        filteredUniversities.map((uni) => {
                          const isSelected = selectedUniversity === uni.id || selectedUniversity === uni.name;
                          return (
                            <button
                              key={uni.id}
                              type="button"
                              onClick={() => {
                                setSelectedUniversity(uni.id);
                                setSelectedDepartment('');
                                setIsUniDropdownOpen(false);
                                setRegTouched((prev) => ({ ...prev, selectedUniversity: true }));
                                if (topBannerError) setTopBannerError(null);
                              }}
                              className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center justify-between group ${
                                isSelected
                                  ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-200'
                                  : 'hover:bg-slate-800/80 text-slate-200'
                              }`}
                            >
                              <div className="flex flex-col gap-0.5 pr-2 overflow-hidden">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-xs group-hover:text-white transition-colors truncate">
                                    {uni.name}
                                  </span>
                                  {uni.abbreviation && (
                                    <span className="text-[9px] font-bold bg-slate-800 text-cyan-300 border border-slate-700 px-1.5 py-0.2 rounded shrink-0">
                                      {uni.abbreviation}
                                    </span>
                                  )}
                                </div>
                                {uni.location && (
                                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                    <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                                    <span className="truncate">{uni.location}</span>
                                  </div>
                                )}
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0 ml-2" />}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {regTouched.selectedUniversity && regErrors.selectedUniversity && (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{regErrors.selectedUniversity}</span>
                  </p>
                )}
              </div>

              {/* Department Selection (Searchable & Categorized by Faculty) */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                  <span>
                    Department / Course <span className="text-rose-400">*</span>
                  </span>
                  {selectedDeptFaculty && (
                    <span className="text-[10px] text-indigo-400 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20 truncate max-w-[200px]">
                      {selectedDeptFaculty}
                    </span>
                  )}
                </label>

                <div className="relative" ref={deptDropdownRef}>
                  <button
                    type="button"
                    disabled={!selectedUniversity}
                    onClick={() => {
                      if (selectedUniversity) {
                        setIsDeptDropdownOpen((prev) => !prev);
                        touchRegField('selectedDepartment');
                      }
                    }}
                    className={`w-full pl-9 pr-8 py-2.5 border rounded-xl text-xs text-left flex items-center justify-between transition-all ${
                      !selectedUniversity
                        ? 'bg-slate-950/40 border-slate-800/60 text-slate-600 cursor-not-allowed'
                        : regTouched.selectedDepartment && regErrors.selectedDepartment
                        ? 'bg-slate-950 border-rose-500 text-slate-200 focus:outline-none focus:border-rose-500 cursor-pointer'
                        : 'bg-slate-950 border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                    <span className={`truncate ${selectedDepartment ? 'text-slate-100 font-semibold' : 'text-slate-500'}`}>
                      {!selectedUniversity
                        ? 'Select a University first'
                        : selectedDepartment || '-- Search or Select Course / Department --'}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 transition-transform ${
                        isDeptDropdownOpen ? 'rotate-180 text-indigo-400' : ''
                      }`}
                    />
                  </button>

                  {/* Searchable Categorized Dropdown Panel */}
                  {isDeptDropdownOpen && selectedUniversity && (
                    <div className="absolute z-50 left-0 right-0 mt-1.5 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden max-h-80 flex flex-col animate-in fade-in slide-in-from-top-2">
                      {/* Search Header Input */}
                      <div className="p-2.5 bg-slate-950 border-b border-slate-800 flex items-center gap-2 sticky top-0 z-10">
                        <Search className="w-4 h-4 text-slate-400 shrink-0" />
                        <input
                          ref={departmentRef as any}
                          type="text"
                          value={deptSearchQuery}
                          onChange={(e) => setDeptSearchQuery(e.target.value)}
                          placeholder="Search course or department (e.g. Computer Science, Law, Nursing)..."
                          className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
                          autoFocus
                        />
                        {deptSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setDeptSearchQuery('')}
                            className="text-slate-500 hover:text-slate-300"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* List of Categorized Faculties & Departments */}
                      <div className="overflow-y-auto flex-1 p-2 space-y-3 custom-scrollbar">
                        {/* Option to use custom typed department/course if search has text */}
                        {deptSearchQuery.trim() && (
                          <div className="p-1.5 mb-1 bg-indigo-950/40 rounded-xl border border-indigo-500/30">
                            <button
                              type="button"
                              onClick={() => {
                                const customDept = deptSearchQuery.trim();
                                setSelectedDepartment(customDept);
                                touchRegField('selectedDepartment');
                                setIsDeptDropdownOpen(false);
                                if (topBannerError) setTopBannerError(null);
                              }}
                              className="w-full text-left px-3 py-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 hover:text-white transition-colors flex items-center justify-between group cursor-pointer"
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
                                <span className="text-xs font-semibold truncate">
                                  Use &quot;{deptSearchQuery.trim()}&quot;
                                </span>
                              </div>
                              <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-1.5 py-0.5 rounded font-bold shrink-0">
                                Custom Course
                              </span>
                            </button>
                          </div>
                        )}

                        {filteredFacultyGroups.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-400">
                            <p>No pre-listed department matching &quot;{deptSearchQuery}&quot; found.</p>
                            <p className="text-[11px] text-slate-500 mt-1">Click the button above to use your typed course name.</p>
                          </div>
                        ) : (
                          filteredFacultyGroups.map((facGroup) => (
                            <div key={facGroup.id} className="space-y-1">
                              {/* Faculty Header Badge */}
                              <div className="text-[11px] font-bold text-indigo-400 px-2 py-1 bg-indigo-500/10 rounded-lg border border-indigo-500/20 flex items-center justify-between">
                                <span className="truncate">{facGroup.name}</span>
                                <span className="text-[9px] text-slate-400 font-normal shrink-0 ml-2">
                                  {facGroup.departments.length} depts
                                </span>
                              </div>

                              {/* Departments under this faculty */}
                              <div className="grid grid-cols-1 gap-0.5 pl-1">
                                {facGroup.departments.map((deptName) => {
                                  const isSelected = selectedDepartment === deptName;
                                  return (
                                    <button
                                      key={deptName}
                                      type="button"
                                      onClick={() => {
                                        setSelectedDepartment(deptName);
                                        touchRegField('selectedDepartment');
                                        setIsDeptDropdownOpen(false);
                                        if (topBannerError) setTopBannerError(null);
                                      }}
                                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                                        isSelected
                                          ? 'bg-indigo-600/30 text-indigo-200 font-bold border border-indigo-500/40'
                                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                      }`}
                                    >
                                      <span className="truncate">{deptName}</span>
                                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 ml-2" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {!selectedUniversity ? (
                  <p className="text-[11px] text-slate-500 mt-1">Select a university to unlock course selection.</p>
                ) : regTouched.selectedDepartment && regErrors.selectedDepartment ? (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{regErrors.selectedDepartment}</span>
                  </p>
                ) : null}
              </div>

              {/* Checkboxes: Terms & Privacy */}
              <div ref={termsContainerRef} className="space-y-2 pt-1 border-t border-slate-800/80">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300 hover:text-slate-100 select-none">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => {
                      setAgreeTerms(e.target.checked);
                      touchRegField('terms');
                      if (topBannerError) setTopBannerError(null);
                    }}
                    className="mt-0.5 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500 shrink-0 cursor-pointer"
                  />
                  <span>I agree to the Terms & Conditions.</span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300 hover:text-slate-100 select-none">
                  <input
                    type="checkbox"
                    checked={agreePrivacy}
                    onChange={(e) => {
                      setAgreePrivacy(e.target.checked);
                      touchRegField('terms');
                      if (topBannerError) setTopBannerError(null);
                    }}
                    className="mt-0.5 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500 shrink-0 cursor-pointer"
                  />
                  <span>I agree to the Privacy Policy.</span>
                </label>

                {regTouched.terms && regErrors.terms && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{regErrors.terms}</span>
                  </p>
                )}
              </div>

              {/* Create Account Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xl shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Creating Student Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Or Continue With Google */}
          {mode !== 'forgot' && mode !== 'admin' && (
            <div className="mt-4 border-t border-slate-800/80 pt-4 text-center">
              <p className="text-[11px] font-semibold text-slate-500 mb-3 tracking-wider">OR CONTINUE WITH</p>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 disabled:opacity-50 border border-slate-800 text-xs font-semibold text-slate-200 rounded-xl flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
                id="google-signin-btn"
              >
                {isGoogleLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                    <span>Connecting to Google Account...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Bottom Switch Text */}
          <div className="mt-4 text-center text-xs text-slate-400">
            {mode === 'register' ? (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setTopBannerError(null);
                    setTopBannerSuccess(null);
                  }}
                  className="text-indigo-400 font-bold hover:underline ml-1 cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            ) : mode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setTopBannerError(null);
                    setTopBannerSuccess(null);
                  }}
                  className="text-indigo-400 font-bold hover:underline ml-1 cursor-pointer"
                >
                  Create Account
                </button>
              </p>
            ) : mode === 'admin' ? (
              <p>
                Are you a student?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setTopBannerError(null);
                    setTopBannerSuccess(null);
                  }}
                  className="text-indigo-400 font-bold hover:underline ml-1 cursor-pointer"
                >
                  Student Sign In
                </button>
              </p>
            ) : null}
          </div>

        </div>
      </div>

      {/* Google Fallback Account Selector Modal */}
      {showGoogleFallbackModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowGoogleFallbackModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Choose a Google Account</h3>
                <p className="text-xs text-slate-400">Select an account to sync and sign in</p>
              </div>
            </div>

            {/* Quick One-Tap Account Suggestion */}
            <div className="mb-4 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Suggested Account</span>
              <button
                type="button"
                onClick={async () => {
                  setIsGoogleLoading(true);
                  try {
                    const targetEmail = 'idrisanderumohammed2521@gmail.com';
                    const targetName = 'Idris Mohammed';
                    const googleUid = `goog_${targetEmail.replace(/[^a-z0-9]/g, '_')}`;
                    await processGoogleUserLogin(targetEmail, targetName, googleUid, 'https://lh3.googleusercontent.com/a/default-user');
                    setShowGoogleFallbackModal(false);
                  } catch (err) {
                    setTopBannerError('Google login failed. Please try manual entry.');
                  } finally {
                    setIsGoogleLoading(false);
                  }
                }}
                className="w-full text-left p-3 bg-slate-950 hover:bg-slate-800/80 border border-indigo-500/30 hover:border-indigo-500 rounded-xl transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-md">
                    I
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-100 group-hover:text-indigo-300">Idris Mohammed</p>
                    <p className="text-[11px] text-slate-400 truncate">idrisanderumohammed2521@gmail.com</p>
                  </div>
                </div>
                <div className="text-xs font-medium text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20 shrink-0">
                  Select
                </div>
              </button>
            </div>

            <div className="relative my-4 flex items-center justify-center">
              <div className="border-t border-slate-800 w-full"></div>
              <span className="bg-slate-900 px-3 text-[10px] uppercase tracking-wider font-semibold text-slate-500">or enter another account</span>
            </div>

            <form onSubmit={handleConfirmGoogleFallback} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Google Email Address <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={googleFallbackEmail}
                    onChange={(e) => setGoogleFallbackEmail(e.target.value)}
                    placeholder="e.g. yourname@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Full Name / Display Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={googleFallbackName}
                    onChange={(e) => setGoogleFallbackName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {(selectedUniversity || selectedDepartment) && (
                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Institution Setup:</span>
                  <div className="text-slate-200 font-medium truncate">
                    {selectedUniversity || 'Federal University Lokoja, Kogi State (FUL)'}
                  </div>
                  <div className="text-indigo-400 text-[11px]">
                    {selectedDepartment || 'Computer Science'}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGoogleFallbackModal(false)}
                  className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGoogleLoading}
                  className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-bold text-white rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <span>Continue</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
