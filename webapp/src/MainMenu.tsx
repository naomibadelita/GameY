import { useNavigate } from 'react-router-dom';
import { useAuth } from './Auth';
import './MainMenu.css';

export default function MainMenu() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="menu-container">
      <div className="menu-content">
        <h1 className="menu-title">Game Y</h1>
        <p className="menu-welcome">Welcome, {user?.displayName}!</p>
        
        <div className="menu-buttons">
          <button 
            type="button"
            className="menu-btn primary-btn"
            onClick={() => navigate('/board-size')}
          >
            Start New Game
          </button>
          
          <button 
            type="button"
            className="menu-btn primary-btn"
            onClick={() => navigate('/leaderboard')}
          >
            View Leaderboard
          </button>
          
          <button 
            type="button"
            className="menu-btn logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}