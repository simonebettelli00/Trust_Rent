import { Component } from "react";
import Button from "./Button";

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Errore non gestito nell'interfaccia:", error, info);
  }

  handleReload = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Qualcosa è andato storto</h1>
          <p className="text-gray-500 max-w-md">
            Si è verificato un errore imprevisto. Prova a tornare alla home; se il problema
            persiste, riprova più tardi.
          </p>
          <Button variant="primary" onClick={this.handleReload}>
            Torna alla home
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
