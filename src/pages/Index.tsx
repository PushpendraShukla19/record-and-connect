import React, { useState } from 'react';
import { RecordingStudio } from '@/components/RecordingStudio';
import { VoiceCallStudio } from '@/components/VoiceCallStudio';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Video, Phone, Zap, Shield, Globe, Users } from 'lucide-react';

type ActiveTab = 'recording' | 'calls' | 'home';

const Index = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');

  const renderContent = () => {
    switch (activeTab) {
      case 'recording':
        return <RecordingStudio />;
      case 'calls':
        return <VoiceCallStudio />;
      default:
        return (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center space-y-6 py-12">
              <div className="space-y-4">
                <h1 className="text-5xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                  Record & Connect
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Professional screen recording and real-time voice communication in your browser. 
                  No downloads required.
                </p>
              </div>
              
              <div className="flex items-center justify-center gap-4 pt-6">
                <Button 
                  variant="hero" 
                  size="xl" 
                  onClick={() => setActiveTab('recording')}
                  className="shadow-glow animate-pulse-glow"
                >
                  <Video className="h-5 w-5" />
                  Start Recording
                </Button>
                <Button 
                  variant="success" 
                  size="xl" 
                  onClick={() => setActiveTab('calls')}
                  className="shadow-success"
                >
                  <Phone className="h-5 w-5" />
                  Voice Call
                </Button>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="group hover:shadow-glow transition-all duration-300 hover:scale-105">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto group-hover:animate-float">
                    <Video className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">Screen Recording</h3>
                  <p className="text-sm text-muted-foreground">
                    Record your screen, specific windows, or camera with high-quality video and audio capture.
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-success transition-all duration-300 hover:scale-105">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="h-12 w-12 bg-gradient-success rounded-lg flex items-center justify-center mx-auto group-hover:animate-float">
                    <Phone className="h-6 w-6 text-success-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">Voice Calls</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect with others through crystal-clear voice calls using WebRTC technology.
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-glow transition-all duration-300 hover:scale-105">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto group-hover:animate-float">
                    <Zap className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">Real-time Processing</h3>
                  <p className="text-sm text-muted-foreground">
                    Instant recording controls with real-time preview and immediate file downloads.
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-glow transition-all duration-300 hover:scale-105">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="h-12 w-12 bg-gradient-success rounded-lg flex items-center justify-center mx-auto group-hover:animate-float">
                    <Shield className="h-6 w-6 text-success-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">Privacy First</h3>
                  <p className="text-sm text-muted-foreground">
                    All processing happens in your browser. Your recordings never leave your device.
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-glow transition-all duration-300 hover:scale-105">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto group-hover:animate-float">
                    <Globe className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">Cross-Platform</h3>
                  <p className="text-sm text-muted-foreground">
                    Works on any modern browser across Windows, Mac, Linux, and mobile devices.
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-success transition-all duration-300 hover:scale-105">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="h-12 w-12 bg-gradient-success rounded-lg flex items-center justify-center mx-auto group-hover:animate-float">
                    <Users className="h-6 w-6 text-success-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">Easy Sharing</h3>
                  <p className="text-sm text-muted-foreground">
                    Share room IDs for instant voice calls or download recordings in standard formats.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Start Guide */}
            <Card className="bg-gradient-to-r from-card via-primary/5 to-card border-primary/20">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4 text-center">Quick Start Guide</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Video className="h-5 w-5 text-primary" />
                      Screen Recording
                    </h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>1. Choose your capture source (screen, window, or camera)</p>
                      <p>2. Enable/disable microphone audio</p>
                      <p>3. Click "Start Recording" to begin</p>
                      <p>4. Use pause/resume controls as needed</p>
                      <p>5. Stop recording and download your file</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Phone className="h-5 w-5 text-success" />
                      Voice Calls
                    </h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>1. Create a new room or enter an existing room ID</p>
                      <p>2. Share the room ID with others to invite them</p>
                      <p>3. Use mute/unmute controls during the call</p>
                      <p>4. Leave the call when finished</p>
                      <p>5. All calls use secure peer-to-peer connections</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setActiveTab('home')}
                className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent hover:opacity-80 transition-opacity"
              >
                Record & Connect
              </button>
              <div className="flex items-center gap-2">
                <Button
                  variant={activeTab === 'recording' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('recording')}
                  className="flex items-center gap-2"
                >
                  <Video className="h-4 w-4" />
                  Recording
                </Button>
                <Button
                  variant={activeTab === 'calls' ? 'success' : 'ghost'}
                  onClick={() => setActiveTab('calls')}
                  className="flex items-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  Voice Calls
                </Button>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              {activeTab === 'recording' && '🔴 Recording Studio'}
              {activeTab === 'calls' && '📞 Voice Calls'}
              {activeTab === 'home' && '🏠 Home'}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>Built with modern web technologies • Screen Capture API • WebRTC • No server required</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
