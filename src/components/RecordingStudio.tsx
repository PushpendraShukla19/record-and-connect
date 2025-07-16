import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Video, 
  Mic, 
  MicOff, 
  Square, 
  Play, 
  Pause, 
  Download, 
  Monitor,
  Smartphone,
  Camera,
  Settings
} from 'lucide-react';

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  recordedBlob: Blob | null;
}

export const RecordingStudio = () => {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    recordedBlob: null
  });
  
  const [micEnabled, setMicEnabled] = useState(true);
  const [captureMode, setCaptureMode] = useState<'screen' | 'window' | 'camera'>('screen');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    intervalRef.current = setInterval(() => {
      setRecordingState(prev => ({ ...prev, duration: prev.duration + 1 }));
    }, 1000);
  };

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const getMediaConstraints = () => {
    const constraints: any = {
      video: true,
      audio: micEnabled
    };

    if (captureMode === 'screen') {
      return constraints;
    } else if (captureMode === 'camera') {
      constraints.video = { facingMode: 'user' };
    }
    
    return constraints;
  };

  const startRecording = useCallback(async () => {
    try {
      let stream: MediaStream;
      
      if (captureMode === 'screen' || captureMode === 'window') {
        // Screen/window capture
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: { 
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: true
        });
        
        // Add microphone if enabled
        if (micEnabled) {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const audioTrack = audioStream.getAudioTracks()[0];
          stream.addTrack(audioTrack);
        }
      } else {
        // Camera capture
        stream = await navigator.mediaDevices.getUserMedia(getMediaConstraints());
      }

      streamRef.current = stream;
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordingState(prev => ({ ...prev, recordedBlob: blob }));
        
        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start(1000); // Collect data every second
      setRecordingState(prev => ({ 
        ...prev, 
        isRecording: true, 
        isPaused: false,
        duration: 0,
        recordedBlob: null 
      }));
      
      startTimer();
      
      toast({
        title: "Recording Started",
        description: `${captureMode} recording is now active`,
      });
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Failed",
        description: "Failed to start recording. Please check permissions.",
        variant: "destructive"
      });
    }
  }, [captureMode, micEnabled, toast]);

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState.isRecording) {
      if (recordingState.isPaused) {
        mediaRecorderRef.current.resume();
        startTimer();
        setRecordingState(prev => ({ ...prev, isPaused: false }));
        toast({ title: "Recording Resumed" });
      } else {
        mediaRecorderRef.current.pause();
        stopTimer();
        setRecordingState(prev => ({ ...prev, isPaused: true }));
        toast({ title: "Recording Paused" });
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      stopTimer();
      setRecordingState(prev => ({ 
        ...prev, 
        isRecording: false, 
        isPaused: false 
      }));
      
      toast({
        title: "Recording Stopped",
        description: "Your recording is ready for download",
      });
    }
  };

  const downloadRecording = () => {
    if (recordingState.recordedBlob) {
      const url = URL.createObjectURL(recordingState.recordedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recording-${new Date().toISOString().slice(0, 19)}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started",
        description: "Your recording is being downloaded",
      });
    }
  };

  const getRecordingStatusBadge = () => {
    if (recordingState.isRecording) {
      if (recordingState.isPaused) {
        return <Badge variant="secondary">Paused</Badge>;
      }
      return <Badge variant="destructive" className="animate-pulse">Recording</Badge>;
    }
    return <Badge variant="outline">Ready</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Recording Status Header */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-card via-card to-primary/5">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Video className="h-6 w-6 text-primary" />
              <CardTitle>Recording Studio</CardTitle>
            </div>
            {getRecordingStatusBadge()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-2xl font-mono font-bold text-primary">
                {formatDuration(recordingState.duration)}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Monitor className="h-4 w-4" />
                <span className="capitalize">{captureMode}</span>
                {micEnabled ? (
                  <div className="flex items-center gap-1 text-success">
                    <Mic className="h-4 w-4" />
                    <span>Audio On</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MicOff className="h-4 w-4" />
                    <span>Audio Off</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {!recordingState.isRecording ? (
                <Button 
                  variant="hero" 
                  size="lg" 
                  onClick={startRecording}
                  className="shadow-glow"
                >
                  <Video className="h-5 w-5" />
                  Start Recording
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={pauseRecording}
                  >
                    {recordingState.isPaused ? (
                      <>
                        <Play className="h-5 w-5" />
                        Resume
                      </>
                    ) : (
                      <>
                        <Pause className="h-5 w-5" />
                        Pause
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="recording" 
                    size="lg" 
                    onClick={stopRecording}
                  >
                    <Square className="h-5 w-5" />
                    Stop
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recording Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Capture Mode */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Capture Source
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
              <Button 
                variant={captureMode === 'screen' ? 'default' : 'outline'}
                onClick={() => setCaptureMode('screen')}
                disabled={recordingState.isRecording}
                className="justify-start"
              >
                <Monitor className="h-4 w-4" />
                Full Screen
              </Button>
              <Button 
                variant={captureMode === 'window' ? 'default' : 'outline'}
                onClick={() => setCaptureMode('window')}
                disabled={recordingState.isRecording}
                className="justify-start"
              >
                <Smartphone className="h-4 w-4" />
                Application Window
              </Button>
              <Button 
                variant={captureMode === 'camera' ? 'default' : 'outline'}
                onClick={() => setCaptureMode('camera')}
                disabled={recordingState.isRecording}
                className="justify-start"
              >
                <Camera className="h-4 w-4" />
                Camera Only
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Audio Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Audio Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              variant={micEnabled ? 'success' : 'outline'}
              onClick={() => setMicEnabled(!micEnabled)}
              disabled={recordingState.isRecording}
              className="w-full justify-start"
            >
              {micEnabled ? (
                <>
                  <Mic className="h-4 w-4" />
                  Microphone Enabled
                </>
              ) : (
                <>
                  <MicOff className="h-4 w-4" />
                  Microphone Disabled
                </>
              )}
            </Button>
            
            {recordingState.recordedBlob && (
              <Button 
                variant="success" 
                onClick={downloadRecording}
                className="w-full"
              >
                <Download className="h-4 w-4" />
                Download Recording
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};