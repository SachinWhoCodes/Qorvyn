import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { MicOff, Square, Play, User, LogOut, CreditCard, Moon, Sun, Settings, Download, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

function Waveform({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-[2px] h-4">
      {[0, 1, 2, 3, 4].map(i => (
        <div
          key={i}
          className={`w-[3px] rounded-full transition-all duration-150 ${
            active ? 'bg-primary' : 'bg-muted-foreground/30'
          }`}
          style={{
            height: active ? undefined : '4px',
            animation: active ? `waveform 1.2s ease-in-out ${i * 0.15}s infinite` : 'none',
          }}
        />
      ))}
    </div>
  );
}

export function Navbar() {
  const {
    user, credits, isListening, micPermission, listeningSeconds, demoSecondsUsed,
    startListening, stopListening, darkMode, toggleDarkMode, logout
  } = useApp();
  const navigate = useNavigate();

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const demoRemaining = user ? null : Math.max(0, 180 - demoSecondsUsed);

  const statusLabel = isListening ? 'Listening' : micPermission === 'denied' ? 'Offline' : 'Ready';
  const statusColor = isListening
    ? 'bg-success/15 text-success border-success/20'
    : 'bg-muted text-muted-foreground border-border';

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between px-4 md:px-6 h-12">
        {/* Left: Brand */}
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">Q</span>
            </div>
            <span className="font-semibold text-sm text-foreground">Qorvyn</span>
          </Link>
          <span className="hidden md:inline text-[11px] text-muted-foreground">
            Live context for conversations
          </span>
        </div>

        {/* Center: Status + Waveform */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full border text-[11px] font-medium ${statusColor}`}>
            {isListening && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success" />
              </span>
            )}
            {micPermission === 'denied' && <MicOff className="w-3 h-3" />}
            {statusLabel}
            {isListening && (
              <span className="text-[10px] opacity-75">{formatTime(listeningSeconds)}</span>
            )}
          </div>
          <Waveform active={isListening} />
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-1.5">
          {/* Demo timer */}
          {!user && demoRemaining !== null && (
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
              demoRemaining < 60 ? 'text-warning border-warning/20 bg-warning/10' : 'text-muted-foreground border-border bg-muted'
            }`}>
              {formatTime(demoRemaining)} trial
            </span>
          )}

          {/* Credits */}
          {user && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/wallet"
                  className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border border-border bg-muted text-muted-foreground hover:bg-accent transition-colors"
                >
                  <CreditCard className="w-3 h-3" />
                  {credits}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">{credits} credits remaining</TooltipContent>
            </Tooltip>
          )}

          {/* Start/Stop */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                onClick={isListening ? stopListening : startListening}
                className={`h-7 px-3 text-xs gap-1 ${
                  isListening
                    ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                }`}
              >
                {isListening ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                {isListening ? 'Stop' : 'Start'}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {isListening ? 'Stop listening' : 'Start listening'} <kbd className="ml-1 px-1 py-0.5 rounded bg-muted text-[10px]">Space</kbd>
            </TooltipContent>
          </Tooltip>

          {/* Export */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="w-7 h-7" disabled>
                <Download className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Export <kbd className="ml-1 px-1 py-0.5 rounded bg-muted text-[10px]">E</kbd>
            </TooltipContent>
          </Tooltip>

          {/* Dark mode */}
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={toggleDarkMode}>
            {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-7 h-7 rounded-full bg-primary/10">
                  <User className="w-3.5 h-3.5 text-primary" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <div className="px-2 py-1.5 text-xs font-medium truncate">{user.name}</div>
                <div className="px-2 pb-1 text-[11px] text-muted-foreground truncate">{user.email}</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/account')} className="text-xs">
                  <Settings className="w-3 h-3 mr-2" /> Account
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/wallet')} className="text-xs">
                  <CreditCard className="w-3 h-3 mr-2" /> Wallet
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs">
                  <Keyboard className="w-3 h-3 mr-2" /> Shortcuts
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { logout(); navigate('/'); }} className="text-xs">
                  <LogOut className="w-3 h-3 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')} className="text-xs h-7 px-2">
                Sign in
              </Button>
              <Button size="sm" onClick={() => navigate('/register')} className="text-xs h-7 px-2.5 bg-primary text-primary-foreground">
                Sign up
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
