import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatResponse {
    reply: string;
    audio_url?: string;
    animation_state?: 'idle' | 'talking';
    transcription?: string;
    model_source?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ChatService {
    // Hybrid Architecture:
    // 1. baseUrl (Localhost) -> Stores Files, History, Persona (Memory)
    // 2. llmUrl (Colab/Ngrok) -> Intelligence (Thinking)

    private baseUrl = 'http://localhost:8000';
    // We send this URL to the backend, so it can proxy the intelligence request
    private getRemoteUrl(): string | null {
        return localStorage.getItem('custom_api_url');
    }

    private messages: { role: 'user' | 'ai', text: string }[] = [];

    constructor(private http: HttpClient) {
        // Load history from local storage on init
        const saved = sessionStorage.getItem('chat_history'); // Session only
        if (saved) {
            try {
                this.messages = JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse chat history', e);
            }
        }
    }

    setApiUrl(url: string) {
        localStorage.setItem('custom_api_url', url);
        alert(`Brain upgraded! Connected to: ${url}\n(Memory System Active)`);
    }

    resetApiUrl() {
        localStorage.removeItem('custom_api_url');
        alert('Brain reset to Localhost (Qwen/CPU)');
    }

    getMessages() {
        return this.messages;
    }

    addMessage(role: 'user' | 'ai', text: string) {
        this.messages.push({ role, text });
        this.saveHistory();
    }

    clearMessages() {
        this.messages = [];
        this.saveHistory();
    }

    private saveHistory() {
        sessionStorage.setItem('chat_history', JSON.stringify(this.messages));
    }

    sendMessage(message: string, muteAudio: boolean = false): Observable<ChatResponse> {
        // Always talk to Local Backend to keep Memory/RAG alive
        const remoteUrl = this.getRemoteUrl();
        return this.http.post<ChatResponse>(`${this.baseUrl}/chat`, {
            message,
            mute_audio: muteAudio,
            remote_llm_url: remoteUrl // Pass the Brain URL to the Body
        });
    }

    sendVoice(audioBlob: Blob): Observable<ChatResponse> {
        const formData = new FormData();
        formData.append('file', audioBlob, 'voice.wav');
        // Voice processing still usually local, but if simplified, can map to local
        return this.http.post<ChatResponse>(`${this.baseUrl}/voice-chat`, formData);
    }

    uploadFile(file: File): Observable<any> {
        // Files stored Locally
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post(`${this.baseUrl}/train`, formData);
    }

    getHistory(): Observable<any[]> {
        // History stored Locally
        return this.http.get<any[]>(`${this.baseUrl}/history`);
    }

    trainText(title: string, text: string): Observable<any> {
        return this.http.post(`${this.baseUrl}/train-text`, { title, text });
    }

    getPersona(): Observable<{ persona: string }> {
        return this.http.get<{ persona: string }>(`${this.baseUrl}/persona`);
    }

    updatePersona(personaText: string): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/persona`, { persona_text: personaText });
    }

    forgetTraining(filename: string): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/forget`, { filename });
    }

    downloadFile(filename: string) {
        window.location.href = `${this.baseUrl}/download/${filename}`;
    }
}
