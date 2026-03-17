"use client";

type AuthNudgeProps = {
  recipeCount: number;
  onSignUp: () => void;
  onDismiss: () => void;
};

export default function AuthNudge({
  recipeCount,
  onSignUp,
  onDismiss,
}: AuthNudgeProps) {
  return (
    <div className="auth-nudge">
      <div className="auth-nudge-content">
        <p className="auth-nudge-text">
          <strong>
            {recipeCount} recipe{recipeCount !== 1 ? "s" : ""} saved locally!
          </strong>{" "}
          Create a free account to access them on any device.
        </p>
        <button className="auth-nudge-btn" onClick={onSignUp}>
          Sign Up Free
        </button>
      </div>
      <button
        className="auth-nudge-dismiss"
        onClick={onDismiss}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
