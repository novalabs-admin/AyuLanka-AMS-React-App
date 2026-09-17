import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SessionHandler = ({ children }) => {
    const navigate = useNavigate();

    useEffect(() => {
      const exp = sessionStorage.getItem('exp');

      if (!exp) {
        // No session — redirect to login only if not already there
        if (window.location.pathname !== '/') {
          sessionStorage.clear();
          navigate('/');
        }
        return;
      }

      try {
        const currentTime = Date.now() / 1000;
        if (Number(exp) < currentTime) {
          sessionStorage.clear();
          navigate('/');
        }
      } catch {
        sessionStorage.clear();
        navigate('/');
      }
    }, [navigate]); // only re-run when navigate changes (stable ref)

    return children;
};

export default SessionHandler;
