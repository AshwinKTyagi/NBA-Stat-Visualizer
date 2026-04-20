import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: "40px 24px", maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ color: "#f85149", marginBottom: 12 }}>Something went wrong</h2>
          <pre style={{
            background: "#161b22",
            border: "1px solid #30363d",
            borderRadius: 8,
            padding: 16,
            color: "#cdd9e5",
            fontSize: 13,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}>
            {this.state.error.message}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              marginTop: 16,
              background: "#21262d",
              border: "1px solid #30363d",
              borderRadius: 6,
              color: "#e6edf3",
              padding: "8px 16px",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
