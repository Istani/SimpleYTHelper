import "./styles.css";

export const metadata = {
  title: "SimpleYTH",
  description: "Community-Werkzeuge für Creator und ihre Zuschauer",
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
