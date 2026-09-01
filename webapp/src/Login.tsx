import { useAuthFormViewModel } from './hooks/useAuthFormViewModel';
import './Login.css';

export default function Login() {
  const { state, actions } = useAuthFormViewModel();

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Game Y</h1>
        <p className="login-subtitle">{state.isLogin ? 'Login' : 'Register'}</p>

        {state.error ? <div className="error-message">{state.error}</div> : null}

        <form onSubmit={actions.handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={state.email}
              onChange={(e) => actions.setEmail(e.target.value)}
              required
              disabled={state.isLoading}
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={state.password}
              onChange={(e) => actions.setPassword(e.target.value)}
              required
              disabled={state.isLoading}
              placeholder="Enter your password"
            />
          </div>

          {!state.isLogin ? (
            <div className="form-group">
              <label htmlFor="displayName">Display Name</label>
              <input
                id="displayName"
                type="text"
                value={state.displayName}
                onChange={(e) => actions.setDisplayName(e.target.value)}
                disabled={state.isLoading}
                placeholder="How should others see you?"
              />
            </div>
          ) : null}

          <button type="submit" disabled={state.isLoading} className="submit-btn">
            {state.buttonLabel}
          </button>
        </form>

        <div className="toggle-section">
          <p>
            {state.isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={actions.toggleMode}
              className="toggle-btn"
            >
              {state.isLogin ? 'Register' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
