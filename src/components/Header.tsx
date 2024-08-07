import React from 'react';
import { NavLink } from 'react-router-dom';
import '../styles.css';

const Header: React.FC = () => {
  return (
    <header className="header">
      <nav>
        <ul>
          <li><NavLink to="/" className={({ isActive }) => (isActive ? 'active' : '')}>Badges</NavLink></li>
          <li><NavLink to="/leaderboard" className={({ isActive }) => (isActive ? 'active' : '')}>Leaderboard</NavLink></li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
