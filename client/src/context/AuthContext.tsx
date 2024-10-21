import {
  createContext,
  useReducer,
  ReactNode,
  Dispatch,
  useEffect,
} from "react";

type User = {
  id: string;
  name: string;
  public_key?: string;
} | null;

export type AuthAction = { type: "LOGIN"; payload: User } | { type: "LOGOUT" };

type AuthState = {
  user: User;
};

interface AuthContextType extends AuthState {
  dispatch: Dispatch<AuthAction>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

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

interface AuthContextProviderProps {
  children: ReactNode;
}

/**
 * AuthContextProvider component
 *
 * This component provides the authentication context to its children.
 * It manages the user's authentication state, including login, and logout.
 * It also handles the persistence of the user's authentication state in localStorage.
 *
 * @param {Object} props - The component props
 * @param {ReactNode} props.children - The child components to be wrapped by this provider
 * @returns {JSX.Element} The provider component wrapping its children
 */
export const AuthContextProvider = ({ children }: AuthContextProviderProps) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (user) dispatch({ type: "LOGIN", payload: user });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};
