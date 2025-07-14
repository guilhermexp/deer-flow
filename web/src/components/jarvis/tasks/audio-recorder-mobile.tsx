"use client"
import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mic, Square, Play, Pause, Trash2 } from "lucide-react"
import { cn } from "~/lib/utils"

export interface AudioRecorderMobileProps {
  onRecordingComplete?: (audioBlob: Blob) => void
  className?: string
}

const AudioRecorderMobile = React.memo(({ 
  onRecordingComplete,
  className 
}: AudioRecorderMobileProps) => {
  const [isRecording, setIsRecording] = useState(false)
  const [hasRecording, setHasRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [playbackTime, setPlaybackTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [waveformData, setWaveformData] = useState<number[]>([])
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const generateWaveform = () => {
    const data = Array.from({ length: 40 }, () => Math.random() * 0.8 + 0.2)
    setWaveformData(data)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      const chunks: BlobPart[] = []
      
      mediaRecorder.ondataavailable = (event) => chunks.push(event.data)
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" })
        setAudioBlob(blob)
        setHasRecording(true)
        generateWaveform()
        
        const audioUrl = URL.createObjectURL(blob)
        audioRef.current = new Audio(audioUrl)
        audioRef.current.onloadedmetadata = () => setDuration(audioRef.current?.duration || 0)
        
        stream.getTracks().forEach((track) => track.stop())
        onRecordingComplete?.(blob)
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      timerRef.current = setInterval(() => setRecordingTime((prev) => prev + 1), 1000)
    } catch (error) {
      console.error("Error accessing microphone:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  const togglePlayback = () => {
    if (!audioRef.current) return
    
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
      playbackTimerRef.current = setInterval(() => {
        if (audioRef.current) {
          setPlaybackTime(audioRef.current.currentTime)
          if (audioRef.current.ended) {
            setIsPlaying(false)
            setPlaybackTime(0)
            audioRef.current.currentTime = 0
            if (playbackTimerRef.current) clearInterval(playbackTimerRef.current)
          }
        }
      }, 100)
    }
  }

  const seekAudio = (percentage: number) => {
    if (audioRef.current && duration > 0) {
      const newTime = (percentage / 100) * duration
      audioRef.current.currentTime = newTime
      setPlaybackTime(newTime)
    }
  }

  const deleteRecording = () => {
    setHasRecording(false)
    setIsPlaying(false)
    setPlaybackTime(0)
    setDuration(0)
    setAudioBlob(null)
    setWaveformData([])
    
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (playbackTimerRef.current) clearInterval(playbackTimerRef.current)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  return (
    <section className={cn("space-y-4 py-2", className)} aria-label="Audio recorder">
      <AnimatePresence mode="wait">
        {!hasRecording ? (
          <motion.section
            key="recording"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center space-y-6 py-6 w-full"
          >
            <figure className="flex flex-col items-center gap-3 w-full">
              <motion.button
                onClick={isRecording ? stopRecording : startRecording}
                className={cn(
                  "relative w-20 h-20 rounded-full border-2 transition-all duration-300",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                  isRecording
                    ? "bg-primary border-primary/70 shadow-md shadow-primary/20"
                    : "bg-primary/10 border-primary/50 hover:bg-primary/20"
                )}
                whileTap={{ scale: 0.96 }}
                aria-label={isRecording ? "Stop recording" : "Start recording"}
                type="button"
              >
                <motion.div
                  animate={isRecording ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                  transition={{ duration: 1, repeat: isRecording ? Number.POSITIVE_INFINITY : 0 }}
                >
                  {isRecording ? (
                    <Square className="w-8 h-8 text-primary-foreground mx-auto" />
                  ) : (
                    <Mic className="w-8 h-8 text-primary mx-auto" />
                  )}
                </motion.div>
                {isRecording && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary"
                    animate={{ scale: [1, 1.5], opacity: [0.7, 0] }}
                    transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                    aria-hidden="true"
                  />
                )}
              </motion.button>
              <figcaption className="text-center space-y-0.5 mt-2 w-full">
                <span className="block text-2xl font-mono font-semibold text-foreground tracking-tight">
                  {formatTime(recordingTime)}
                </span>
                <span className="block text-sm text-muted-foreground">
                  {isRecording ? "Gravando..." : "Toque para gravar"}
                </span>
              </figcaption>
            </figure>
          </motion.section>
        ) : (
          <motion.div
            key="playback"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 py-2"
          >
            <div className="relative h-16 rounded-md bg-muted/30 p-3 overflow-hidden">
              <div className="flex items-center justify-center h-full space-x-0.5">
                {waveformData.map((height, index) => (
                  <motion.div
                    key={index}
                    className={cn(
                      "w-1 rounded-full transition-colors duration-200",
                      index < (playbackTime / duration) * waveformData.length
                        ? "bg-accent-red"
                        : "bg-muted-foreground/50"
                    )}
                    style={{ height: `${height * 100}%` }}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: index * 0.02 }}
                  />
                ))}
              </div>
              <button
                className="absolute inset-0 w-full h-full cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const percentage = ((e.clientX - rect.left) / rect.width) * 100
                  seekAudio(percentage)
                }}
                aria-label="Seek audio position"
              />
            </div>
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center space-x-3">
                <motion.button
                  onClick={togglePlayback}
                  className={cn(
                    "w-12 h-12 bg-accent-red hover:bg-accent-red/80 rounded-full",
                    "flex items-center justify-center transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-accent-red/30"
                  )}
                  whileTap={{ scale: 0.95 }}
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-white" />
                  ) : (
                    <Play className="w-5 h-5 text-white ml-0.5" />
                  )}
                </motion.button>
                <div className="text-sm font-mono text-muted-foreground">
                  <span>{formatTime(playbackTime)}</span>
                  <span className="text-muted-foreground/70 mx-1">/</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
              <motion.button
                onClick={deleteRecording}
                className={cn(
                  "w-10 h-10 bg-muted hover:bg-destructive/80 rounded-full",
                  "flex items-center justify-center transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-muted/30 group"
                )}
                whileTap={{ scale: 0.95 }}
                aria-label="Delete recording"
              >
                <Trash2 className="w-4 h-4 text-muted-foreground group-hover:text-destructive-foreground" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
})

AudioRecorderMobile.displayName = "AudioRecorderMobile"

export default AudioRecorderMobile