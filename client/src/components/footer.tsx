export function Footer() {
  return (
    <footer className="border-t bg-muted/30 py-12 px-4" data-testid="footer">
      <div className="max-w-6xl mx-auto">
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground font-body" data-testid="text-footer-tagline">
            A quiet corner of the internet for prayer and support
          </p>
          <p className="text-xs text-muted-foreground" data-testid="text-footer-copyright">
            © {new Date().getFullYear()} QuietPrayers. All prayers are anonymous.
          </p>
        </div>
      </div>
    </footer>
  );
}
