"use client";

import { useState, useRef } from "react";
import { supabase } from "../../lib/supabase";
import LocationPicker from "./LocationPicker";
import { applyLocationOffset } from "../../lib/location";
import HCaptcha from "@hcaptcha/react-hcaptcha";

interface ReportFormProps {
  onReportCreated?: () => void;
  onViewMap?: () => void;
}

export default function ReportForm({
    onReportCreated,
    onViewMap,
  }: ReportFormProps) {
  
  const [type, setType] = useState("");
  const [animalType, setAnimalType] = useState("");
  
  const [animalName, setAnimalName] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const [latitude, setLatitude] = useState<number>(51.0206);
  const [longitude, setLongitude] = useState<number>(4.4756);

  const [contact, setContact] = useState<string>("");
  const [photo, setPhoto] = useState<File | null>(null);

  const [consent, setConsent] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | "info" | null>(null);
  const [editLink, setEditLink] = useState<string | null>(null);

  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const lastSubmitKey = "last_submit_time";
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const copyToClipboard = async () => {
    if (!editLink) return;
    await navigator.clipboard.writeText(editLink);
    setMessage("Edit link copied!");
    setMessageType("success");

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setTimeout(() => {
      setMessage(null);
      setMessageType(null);
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!captchaToken) {
      setMessage("Please complete the captcha.");
      setMessageType("error");
      return;
    }

    const last = localStorage.getItem(lastSubmitKey);
    if (last) {
      const diff = Date.now() - Number(last);
      if (diff < 30000) {
        setMessage("Please wait a few seconds before submitting again.");
        setMessageType("error");
        return;
      }
    }

    if (!consent) {
      setMessage("You must give consent to submit.");
      setMessageType("error");
      return;
    }

    if (!description || description.trim().length < 5) {
      setMessage("Please provide a short description.");
      setMessageType("error");
      return;
    }

    if (!latitude || !longitude) {
      setMessage("Please select a location.");
      setMessageType("error");
      return;
    }

    if (!contact || contact.trim().length < 3) {
      setMessage("Please provide contact information.");
      setMessageType("error");
      return;
    }

    setIsSubmitting(true);
    setMessage("Submitting...");
    setMessageType("info");

    try {
      let photo_url: string | null = null;

      if (photo) {
        const fileExt = photo.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;

        const { error } = await supabase.storage
          .from("report-photos")
          .upload(fileName, photo, {
            cacheControl: "3600",
            upsert: true,
          });

        if (error) {
          setMessage("Photo upload failed: " + error.message);
          setMessageType("error");
          return;
        }

        const { data } = supabase.storage
          .from("report-photos")
          .getPublicUrl(fileName);

        photo_url = data.publicUrl ?? null;
      }

      const { latitude: safeLat, longitude: safeLng } =
        applyLocationOffset(latitude, longitude);

      if (contact.includes("http")) {
        setMessage("Links are not allowed in contact info.");
        setMessageType("error");
        return;
      }

      if (contact.length > 200) {
        setMessage("Contact info is too long.");
        setMessageType("error");
        return;
      }

      const payload = {
        token: captchaToken,
        report: {
          type,
          animal_type: animalType,
          animal_name: animalName ?? "",
          description: description ?? "",
          latitude: safeLat,
          longitude: safeLng,
          contact_info: contact ?? "",
          photo_url,
        },
      };

      const res = await fetch(
        "https://dmubikdkyusadzqngapy.supabase.co/functions/v1/verify-captcha",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const text = await res.text();

      let result;
      try {
        result = JSON.parse(text);
      } catch {
        setMessage("Server error (invalid response)");
        setMessageType("error");
        return;
      }

      // handle HTTP errors explicitly
      if (!res.ok) {
        setMessage(result?.error || "Request failed");
        setMessageType("error");
        return;
      }

      if (!result.success) {
        setMessage(result.error || "Submission failed");
        setMessageType("error");
        return;
      }

      localStorage.setItem(lastSubmitKey, Date.now().toString());

      setEditLink(result.edit_link);
      //setMessage("Report submitted successfully! Redirecting to map...");
      //setMessageType("success");

      // reset form safely
      setType("lost");
      setAnimalType("dog");
      setAnimalName("");
      setDescription("");
      setPhoto(null);
      setLatitude(51.0206);
      setLongitude(4.4756);
      setContact("");
      setConsent(false);

    } catch (err) {
      setMessage("Something went wrong. Please try again.");
      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      
      <div className="grid md:grid-cols-2 gap-8 items-start bg-gray-900 text-white rounded-lg p-6 shadow-lg border border-gray-800">

        {/* ================= LEFT COLUMN ================= */}
        <div className="space-y-6 md:border-r md:border-gray-700 md:pr-8">

          {/* TYPE */}
          <label className="block">
            <span className="block text-sm font-medium mb-1">Type</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "lost" | "found" | "")}
              className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white"
            >
              <option value="" disabled>
                Select status...
              </option>

              <option value="lost">Lost</option>
              <option value="found">Found</option>
            </select>
          </label>

          {/* ANIMAL TYPE */}
          <label className="block">
            <span className="block text-sm font-medium mb-1">Animal type</span>
            <select
              value={animalType}
              onChange={(e) => setAnimalType(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white"
            >
              <option value="" disabled>
                Select animal type...
              </option>

              <option value="dog">Dog</option>
              <option value="cat">Cat</option>
              <option value="bird">Bird</option>
              <option value="rodent">Rodent</option>
              <option value="other">Other</option>
            </select>
          </label>

          {/* ANIMAL NAME */}
          <label className="block">
            <span className="block text-sm font-medium mb-1">
              Animal name (optional)
            </span>
            <input
              value={animalName ?? ""}
              onChange={(e) => setAnimalName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white"
              placeholder="e.g. Bella"
            />
          </label>

          {/* DESCRIPTION */}
          <label className="block">
            <span className="block text-sm font-medium mb-1">Description</span>
            <textarea
              value={description ?? ""}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded p-2 min-h-[120px] text-white"
              placeholder="Describe the pet, location, behavior, etc."
            />
          </label>

          {/* CONTACT */}
          <label className="block">
            <span className="block text-sm font-medium mb-1">Contact</span>
            <input
              value={contact ?? ""}
              onChange={(e) => setContact(e.target.value)}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white"
              placeholder="Phone or email"
            />
          </label>

          {/* PHOTO */}
          <div className="block space-y-2">
            <span className="block text-sm font-medium">Photo (optional)</span>
            
            <label className="inline-block">
              <span className="cursor-pointer inline-block bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded hover:bg-gray-700">
                Choose photo
              </span>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>

            {photo && (
              <p className="text-xs text-gray-400">
                Selected: {photo.name}
              </p>
            )}
          </div>

        </div>

        {/* ================= RIGHT COLUMN ================= */}
        <div className="space-y-6 md:pl-8">

          {/* LOCATION */}
          <div className="w-full overflow-hidden rounded">
            <LocationPicker
              latitude={latitude}
              longitude={longitude}
              setLatitude={setLatitude}
              setLongitude={setLongitude}
            />
            <p className="text-xs italic text-gray-400">
              Location will be slightly blurred for privacy.
            </p>
          </div>

          {/* CAPTCHA */}
          <div className="pt-2">
            <HCaptcha
              sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
              onVerify={(token) => setCaptchaToken(token)}
              onExpire={() => setCaptchaToken(null)}
            />
          </div>

          {/* CONSENT */}
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={consent}
              onChange={() => setConsent(!consent)}
              className="mt-1"
            />
            <span>I consent to sharing this report</span>
          </label>

          {/* SUBMIT */}
          <button
            type="submit"
            className="w-full bg-white text-black py-2 rounded hover:opacity-90 disabled:opacity-50 font-medium"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit report"}
          </button>

          {/* MESSAGE */}
          {message && (
            <div
              className={`mt-4 text-sm p-3 rounded border transition-all duration-300 animate-fade-in ${
                messageType === "success"
                  ? "bg-green-900/30 border-green-700 text-green-300"
                  : messageType === "error"
                  ? "bg-red-900/30 border-red-700 text-red-300"
                  : "bg-gray-800 border-gray-700 text-gray-300"
              }`}
            >
              {message}
            </div>
          )}

          {/* EDIT LINK */}
          {editLink && (
            <div className="mt-6 p-4 rounded-lg border bg-green-900/20 border-green-600 text-green-200 space-y-3">
              
              <div>
                <p className="font-medium">✓ Report submitted successfully</p>
                <p className="text-sm text-green-300">
                  You can edit or delete this report using the link below.
                </p>
              </div>

              <div className="break-all text-xs bg-black/30 p-2 rounded">
                {editLink}
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="text-sm underline text-green-300 text-left"
                >
                  Copy edit link
                </button>

                <button
                  type="button"
                  onClick={onViewMap}
                  className="text-sm underline text-green-300 hover:text-green-200 text-left"
                >
                  → View on map
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </form>
  );
}