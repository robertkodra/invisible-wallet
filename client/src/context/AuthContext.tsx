import {
  createContext,
  useReducer,
  ReactNode,
  Dispatch,
  useEffect,
} from "react";

// Define types for user and actions
type User = {
  id: string;
  name: string;
  public_key?: string;
  // Add more fields as needed
} | null;

export type AuthAction = { type: "LOGIN"; payload: User } | { type: "LOGOUT" };

type AuthState = {
  user: User;
};

// Create context types
interface AuthContextType extends AuthState {
  dispatch: Dispatch<AuthAction>;
}

// Create the AuthContext
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

// Reducer function
export const authReducer = (
  state: AuthState,
  action: AuthAction
): AuthState => {
  switch (action.type) {
    case "LOGIN":
      return { user: action.payload };
    case "LOGOUT":
      return { user: null };
    default:
      return state;
  }
};

// Define props for AuthContextProvider
interface AuthContextProviderProps {
  children: ReactNode;
}

// Context Provider component
export const AuthContextProvider = ({ children }: AuthContextProviderProps) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (user) dispatch({ type: "LOGIN", payload: user });
  }, []);

  console.log("AuthContext state:", state);

  return (
    <AuthContext.Provider value={{ ...state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};
