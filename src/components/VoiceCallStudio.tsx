import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Phone, 
  PhoneCall, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2,
  VolumeX,
  Users,
  Copy,
  UserPlus
} from 'lucide-react';

interface CallState {
  isInCall: boolean;
  isConnecting: boolean;
  callDuration: number;
  roomId: string;
  isHost: boolean;
}

interface PeerConnection {
  id: string;
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

export const VoiceCallStudio = () => {
  const [callState, setCallState] = useState<CallState>({
    isInCall: false,
    isConnecting: false,
    callDuration: 0,
    roomId: '',
    isHost: false
  });
  
  const [micEnabled, setMicEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [roomInput, setRoomInput] = useState('');
  const [peers, setPeers] = useState<PeerConnection[]>([]);
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();

  const formatCallDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const generateRoomId = (): string => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const startCallTimer = () => {
    callTimerRef.current = setInterval(() => {
      setCallState(prev => ({ ...prev, callDuration: prev.callDuration + 1 }));
    }, 1000);
  };

  const stopCallTimer = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  };

  const initializeLocalStream = async (): Promise<MediaStream> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });
      
      localStreamRef.current = stream;
      return stream;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw new Error('Failed to access microphone');
    }
  };

  const createRoom = useCallback(async () => {
    try {
      setCallState(prev => ({ ...prev, isConnecting: true }));
      
      const roomId = generateRoomId();
      await initializeLocalStream();
      
      setCallState(prev => ({ 
        ...prev, 
        isInCall: true, 
        isConnecting: false,
        callDuration: 0,
        roomId,
        isHost: true
      }));
      
      startCallTimer();
      
      toast({
        title: "Room Created",
        description: `Room ID: ${roomId}. Share this with others to join the call.`,
      });
      
    } catch (error) {
      console.error('Error creating room:', error);
      setCallState(prev => ({ ...prev, isConnecting: false }));
      toast({
        title: "Failed to Create Room",
        description: "Please check your microphone permissions and try again.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const joinRoom = useCallback(async () => {
    if (!roomInput.trim()) {
      toast({
        title: "Room ID Required",
        description: "Please enter a room ID to join a call.",
        variant: "destructive"
      });
      return;
    }

    try {
      setCallState(prev => ({ ...prev, isConnecting: true }));
      
      await initializeLocalStream();
      
      setCallState(prev => ({ 
        ...prev, 
        isInCall: true, 
        isConnecting: false,
        callDuration: 0,
        roomId: roomInput.trim(),
        isHost: false
      }));
      
      startCallTimer();
      
      toast({
        title: "Joined Room",
        description: `Connected to room: ${roomInput.trim()}`,
      });
      
    } catch (error) {
      console.error('Error joining room:', error);
      setCallState(prev => ({ ...prev, isConnecting: false }));
      toast({
        title: "Failed to Join Room",
        description: "Please check your microphone permissions and try again.",
        variant: "destructive"
      });
    }
  }, [roomInput, toast]);

  const leaveCall = useCallback(() => {
    // Clean up local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Clean up peer connections
    peers.forEach(peer => {
      peer.connection.close();
      if (peer.stream) {
        peer.stream.getTracks().forEach(track => track.stop());
      }
    });
    setPeers([]);

    stopCallTimer();
    
    setCallState({
      isInCall: false,
      isConnecting: false,
      callDuration: 0,
      roomId: '',
      isHost: false
    });
    
    toast({
      title: "Call Ended",
      description: "You have left the voice call.",
    });
  }, [peers, toast]);

  const toggleMicrophone = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !micEnabled;
        setMicEnabled(!micEnabled);
        
        toast({
          title: micEnabled ? "Microphone Muted" : "Microphone Unmuted",
          description: micEnabled ? "Your microphone is now muted" : "Your microphone is now active",
        });
      }
    }
  };

  const copyRoomId = () => {
    if (callState.roomId) {
      navigator.clipboard.writeText(callState.roomId);
      toast({
        title: "Room ID Copied",
        description: "The room ID has been copied to your clipboard.",
      });
    }
  };

  const getCallStatusBadge = () => {
    if (callState.isConnecting) {
      return <Badge variant="secondary" className="animate-pulse">Connecting...</Badge>;
    }
    if (callState.isInCall) {
      return <Badge variant="destructive" className="animate-pulse">In Call</Badge>;
    }
    return <Badge variant="outline">Ready</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Call Status Header */}
      <Card className="border-2 border-success/20 bg-gradient-to-r from-card via-card to-success/5">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Phone className="h-6 w-6 text-success" />
              <CardTitle>Voice Call Studio</CardTitle>
            </div>
            {getCallStatusBadge()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-2xl font-mono font-bold text-success">
                {formatCallDuration(callState.callDuration)}
              </div>
              {callState.roomId && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Room: {callState.roomId}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyRoomId}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-4 text-sm">
                {micEnabled ? (
                  <div className="flex items-center gap-1 text-success">
                    <Mic className="h-4 w-4" />
                    <span>Mic On</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MicOff className="h-4 w-4" />
                    <span>Mic Off</span>
                  </div>
                )}
                {audioEnabled ? (
                  <div className="flex items-center gap-1 text-success">
                    <Volume2 className="h-4 w-4" />
                    <span>Audio On</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <VolumeX className="h-4 w-4" />
                    <span>Audio Off</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {!callState.isInCall ? (
                <div className="flex gap-2">
                  <Button 
                    variant="success" 
                    size="lg" 
                    onClick={createRoom}
                    disabled={callState.isConnecting}
                    className="shadow-success"
                  >
                    <UserPlus className="h-5 w-5" />
                    Create Room
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={joinRoom}
                    disabled={callState.isConnecting || !roomInput.trim()}
                  >
                    <PhoneCall className="h-5 w-5" />
                    Join Room
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    variant={micEnabled ? 'success' : 'outline'} 
                    size="lg" 
                    onClick={toggleMicrophone}
                  >
                    {micEnabled ? (
                      <>
                        <Mic className="h-5 w-5" />
                        Mute
                      </>
                    ) : (
                      <>
                        <MicOff className="h-5 w-5" />
                        Unmute
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="lg" 
                    onClick={leaveCall}
                  >
                    <PhoneOff className="h-5 w-5" />
                    Leave Call
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call Controls */}
      {!callState.isInCall && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PhoneCall className="h-5 w-5" />
              Join a Call
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter Room ID to join"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                disabled={callState.isConnecting}
                className="flex-1"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>• Create a new room to start a voice call and get a shareable room ID</p>
              <p>• Join an existing room by entering the room ID provided by the host</p>
              <p>• Voice calls use WebRTC for peer-to-peer communication</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Call Info */}
      {callState.isInCall && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Call Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-success/10 rounded-lg border border-success/20">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 bg-success rounded-full animate-pulse"></div>
                <div>
                  <div className="font-medium">
                    {callState.isHost ? 'Hosting Room' : 'Joined Room'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Room ID: {callState.roomId}
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyRoomId}
              >
                <Copy className="h-4 w-4" />
                Copy Room ID
              </Button>
            </div>
            
            {callState.isHost && (
              <div className="text-sm text-muted-foreground">
                <p>Share your Room ID with others so they can join the call.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};