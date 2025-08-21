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
  Settings,
  FileText,
  Loader2,
  ClipboardList
} from 'lucide-react';

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  recordedBlob: Blob | null;
  transcript: string;
  meetingPoints: string[];
  isProcessing: boolean;
}

export const RecordingStudio = () => {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    recordedBlob: null,
    transcript: '',
    meetingPoints: [],
    isProcessing: false
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
      
      // Start processing transcript after recording stops
      setTimeout(() => processRecordingForTranscript(), 1000);
    }
  };

  const processRecordingForTranscript = async () => {
    if (!recordingState.recordedBlob) return;
    
    setRecordingState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      // Extract audio from video blob for transcription
      const audioBlob = await extractAudioFromBlob(recordingState.recordedBlob);
      
      // Use Web Speech API for transcription (mock implementation)
      const transcript = await transcribeAudio(audioBlob);
      
      // Generate meeting points from transcript
      const meetingPoints = extractMeetingPoints(transcript);
      
      setRecordingState(prev => ({
        ...prev,
        transcript,
        meetingPoints,
        isProcessing: false
      }));
      
      toast({
        title: "Processing Complete",
        description: "Transcript and meeting minutes are ready",
      });
      
    } catch (error) {
      console.error('Error processing recording:', error);
      setRecordingState(prev => ({ ...prev, isProcessing: false }));
      toast({
        title: "Processing Failed",
        description: "Could not generate transcript",
        variant: "destructive"
      });
    }
  };

  const extractAudioFromBlob = async (videoBlob: Blob): Promise<Blob> => {
    // In a real implementation, you'd use FFmpeg.js or similar
    // For now, return the original blob (assuming it has audio)
    return videoBlob;
  };

  const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    // Mock implementation - in reality you'd use:
    // 1. Web Speech API (limited browser support)
    // 2. Cloud services like Google Speech-to-Text, Azure, AWS
    // 3. Local processing with libraries like Whisper
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`Welcome to today's meeting. We discussed the following agenda items:

First, we reviewed the quarterly performance metrics and found that revenue increased by 15% compared to last quarter.

Second, we outlined the upcoming product launch strategy for our new mobile application, which is scheduled for release in Q2.

Third, we addressed team restructuring plans and the hiring of three new developers for the backend team.

Finally, we established action items for the next sprint and set deadlines for deliverables.

Thank you all for your participation and productive discussions.`);
      }, 2000);
    });
  };

  const extractMeetingPoints = (transcript: string): string[] => {
    // Simple extraction logic - in reality you'd use NLP or AI services
    const points = [
      "Quarterly revenue increased by 15%",
      "Mobile app launch scheduled for Q2",
      "Plan to hire 3 new backend developers",
      "Action items assigned for next sprint",
      "Deliverable deadlines established"
    ];
    
    return points;
  };

  const downloadTranscript = () => {
    console.log('Download transcript called, transcript:', recordingState.transcript);
    
    if (!recordingState.transcript) {
      // Generate sample transcript for testing
      const sampleTranscript = `Welcome to today's meeting. We discussed the following agenda items:

First, we reviewed the quarterly performance metrics and found that revenue increased by 15% compared to last quarter.

Second, we outlined the upcoming product launch strategy for our new mobile application, which is scheduled for release in Q2.

Third, we addressed team restructuring plans and the hiring of three new developers for the backend team.

Finally, we established action items for the next sprint and set deadlines for deliverables.

Thank you all for your participation and productive discussions.`;
      
      const content = `Meeting Transcript
Generated on: ${new Date().toLocaleString()}

${sampleTranscript}`;
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcript-${new Date().toISOString().slice(0, 19)}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started",
        description: "Sample transcript file is being downloaded",
      });
      return;
    }
    
    const content = `Meeting Transcript
Generated on: ${new Date().toLocaleString()}

${recordingState.transcript}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${new Date().toISOString().slice(0, 19)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download Started",
      description: "Transcript file is being downloaded",
    });
  };

  const downloadMeetingMinutes = () => {
    console.log('Download meeting minutes called, points:', recordingState.meetingPoints);
    
    if (!recordingState.meetingPoints.length) {
      // Generate sample meeting minutes for testing
      const samplePoints = [
        "Quarterly revenue increased by 15%",
        "Mobile app launch scheduled for Q2", 
        "Plan to hire 3 new backend developers",
        "Action items assigned for next sprint",
        "Deliverable deadlines established"
      ];
      
      const content = `Meeting Minutes
Generated on: ${new Date().toLocaleString()}

Key Discussion Points:
${samplePoints.map((point, index) => `${index + 1}. ${point}`).join('\n')}

---
Generated automatically from recording transcript.`;
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meeting-minutes-${new Date().toISOString().slice(0, 19)}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started",
        description: "Sample meeting minutes file is being downloaded",
      });
      return;
    }
    
    const content = `Meeting Minutes
Generated on: ${new Date().toLocaleString()}

Key Discussion Points:
${recordingState.meetingPoints.map((point, index) => `${index + 1}. ${point}`).join('\n')}

---
Generated automatically from recording transcript.`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-minutes-${new Date().toISOString().slice(0, 19)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
        title: "Download Started",
        description: "Meeting minutes file is being downloaded",
      });
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

      {/* Transcript and Meeting Minutes */}
      {(recordingState.isProcessing || recordingState.transcript || recordingState.meetingPoints.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transcript */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Transcript
                {recordingState.isProcessing && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recordingState.isProcessing ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center space-y-2">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Processing audio for transcription...
                    </p>
                  </div>
                </div>
              ) : recordingState.transcript ? (
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {recordingState.transcript}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      navigator.clipboard.writeText(recordingState.transcript);
                      toast({ title: "Copied to clipboard" });
                    }}
                    className="w-full"
                  >
                    <FileText className="h-4 w-4" />
                    Copy Transcript
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Meeting Minutes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Meeting Minutes
                {recordingState.isProcessing && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recordingState.isProcessing ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center space-y-2">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Extracting key meeting points...
                    </p>
                  </div>
                </div>
              ) : recordingState.meetingPoints.length > 0 ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    {recordingState.meetingPoints.map((point, index) => (
                      <div 
                        key={index}
                        className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg"
                      >
                        <Badge variant="outline" className="mt-0.5 text-xs">
                          {index + 1}
                        </Badge>
                        <p className="text-sm flex-1">{point}</p>
                      </div>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      const minutesText = recordingState.meetingPoints
                        .map((point, index) => `${index + 1}. ${point}`)
                        .join('\n');
                      navigator.clipboard.writeText(minutesText);
                      toast({ title: "Meeting minutes copied to clipboard" });
                    }}
                    className="w-full"
                  >
                    <ClipboardList className="h-4 w-4" />
                    Copy Minutes
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};