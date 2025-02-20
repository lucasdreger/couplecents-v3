import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../utils/store';
import { Button } from '@/components/ui/button';

export function MainNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuthStore();

  if (loading) return null;

  const isActive = (path: string) => location.pathname === path;

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Button
            variant={isActive('/Overview') ? 'default' : 'ghost'}
            className="mr-2"
            onClick={() => navigate('/Overview')}
          >
            Overview
          </Button>
          <Button
            variant={isActive('/Administration') ? 'default' : 'ghost'}
            className="mr-2"
            onClick={() => navigate('/Administration')}
          >
            Administration
          </Button>
          <Button
            variant={isActive('/MonthlyDetails') ? 'default' : 'ghost'}
            onClick={() => navigate('/MonthlyDetails')}
          >
            Monthly Details
          </Button>
        </div>
        
        {/* Mobile menu */}
        <div className="flex md:hidden space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => navigate('/Overview')}
          >
            Overview
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => navigate('/Administration')}
          >
            Admin
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => navigate('/MonthlyDetails')}
          >
            Monthly
          </Button>
        </div>
      </div>
    </nav>
  );
}
