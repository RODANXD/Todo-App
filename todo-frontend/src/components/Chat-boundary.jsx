import React, { useState, useEffect , useRef} from "react";


class ChatErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, errorMessage: '' };
    }

    static getDerivedStateFromError(error) {
        return { 
            hasError: true, 
            errorMessage: error.message 
        };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Chat Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 bg-red-100 text-red-700 rounded">
                    <h3 className="font-bold">Something went wrong with the chat.</h3>
                    <p className="text-sm mt-2">{this.state.errorMessage}</p>
                    <button 
                        onClick={() => this.setState({ hasError: false, errorMessage: '' })}
                        className="mt-2 bg-red-700 text-white px-4 py-2 rounded"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ChatErrorBoundary;