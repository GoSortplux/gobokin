import React, { useEffect, useState } from "react";
import { Bell, Info, Plus, Trash2, HelpCircle } from "lucide-react";
import api from "@/services/api";
import { translateError } from "@/utils/errors";

interface EventReminderSectionProps {
  remindersEnabled: boolean;
  reminderCustomText: string;
  reminderFrequencies: number[];
  useDefaultFrequencies: boolean;
  onChange: (updates: {
    remindersEnabled?: boolean;
    reminderCustomText?: string;
    reminderFrequencies?: number[];
    useDefaultFrequencies?: boolean;
  }) => void;
  isHostEventPage?: boolean; // slight styling adaptation if needed
}

export const EventReminderSection: React.FC<EventReminderSectionProps> = ({
  remindersEnabled,
  reminderCustomText,
  reminderFrequencies,
  useDefaultFrequencies,
  onChange,
  isHostEventPage = false,
}) => {
  const [loadingDefaults, setLoadingDefaults] = useState(false);
  const [defaults, setDefaults] = useState<{
    defaultFrequencies: number[];
    defaultTextTemplate: string;
    description?: string;
  } | null>(null);
  const [customHourInput, setCustomHourInput] = useState("");
  const [inputError, setInputError] = useState("");
  const [showTokenHelp, setShowTokenHelp] = useState(false);

  // Fetch defaults once when component mounts or reminders are enabled
  useEffect(() => {
    let active = true;
    const fetchDefaults = async () => {
      if (defaults) return;
      setLoadingDefaults(true);
      try {
        const res = await api.get("/events/utils/reminder-defaults");
        if (res.data?.success && active) {
          setDefaults(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch reminder defaults:", translateError(err));
      } finally {
        if (active) setLoadingDefaults(false);
      }
    };

    if (remindersEnabled) {
      fetchDefaults();
    }

    return () => {
      active = false;
    };
  }, [remindersEnabled, defaults]);

  // Pre-populate fields on first enabling if they are empty
  const handleToggleReminders = async () => {
    const nextEnabled = !remindersEnabled;

    if (nextEnabled) {
      setLoadingDefaults(true);
      try {
        const res = await api.get("/events/utils/reminder-defaults");
        if (res.data?.success) {
          const fetchedDefaults = res.data.data;
          setDefaults(fetchedDefaults);

          // Auto-populate custom text and frequencies if they are empty
          const textToSet = reminderCustomText ? reminderCustomText : fetchedDefaults.defaultTextTemplate;
          const freqsToSet = reminderFrequencies && reminderFrequencies.length > 0
            ? reminderFrequencies
            : [];

          onChange({
            remindersEnabled: true,
            reminderCustomText: textToSet,
            reminderFrequencies: freqsToSet,
          });
        } else {
          onChange({ remindersEnabled: true });
        }
      } catch (err) {
        console.error("Failed to pre-populate reminder defaults on toggle:", err);
        onChange({ remindersEnabled: true });
      } finally {
        setLoadingDefaults(false);
      }
    } else {
      onChange({ remindersEnabled: false });
    }
  };

  const handleAddFrequency = (e: React.FormEvent) => {
    e.preventDefault();
    setInputError("");
    const hours = parseInt(customHourInput.trim(), 10);
    if (isNaN(hours) || hours <= 0) {
      setInputError("Please enter a valid positive number of hours.");
      return;
    }
    if (reminderFrequencies.includes(hours)) {
      setInputError("This relative offset is already added.");
      return;
    }
    const updatedFreqs = [...reminderFrequencies, hours].sort((a, b) => b - a);
    onChange({ reminderFrequencies: updatedFreqs });
    setCustomHourInput("");
  };

  const handleRemoveFrequency = (hours: number) => {
    const updatedFreqs = reminderFrequencies.filter((f) => f !== hours);
    onChange({ reminderFrequencies: updatedFreqs });
  };

  const containerBg = isHostEventPage ? "bg-white" : "bg-gray-50";
  const roundedStyle = isHostEventPage ? "rounded-2xl" : "rounded-[2.5rem]";

  return (
    <div className={`space-y-6 p-6 sm:p-8 ${containerBg} ${roundedStyle} border border-gray-100 shadow-sm transition-all duration-300`}>
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm ${remindersEnabled ? 'bg-primary text-white scale-105' : 'bg-white border border-gray-100 text-gray-400'}`}>
            <Bell size={22} className={remindersEnabled ? "animate-bounce" : ""} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Automated Reminders</h4>
            <p className="text-xs text-gray-500 leading-tight">Send dynamic automated reminders to registered guests before the event starts.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleToggleReminders}
          disabled={loadingDefaults}
          className={`w-14 h-8 rounded-full transition-all relative shrink-0 focus:outline-none focus:ring-2 focus:ring-primary/20 ${remindersEnabled ? 'bg-primary' : 'bg-gray-300'} ${loadingDefaults ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${remindersEnabled ? 'left-7' : 'left-1'}`} />
        </button>
      </div>

      {remindersEnabled && (
        <div className="space-y-6 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-4 duration-300">

          {/* Custom message field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                Custom Reminder Text
              </label>
              <button
                type="button"
                onClick={() => setShowTokenHelp(!showTokenHelp)}
                className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1 text-[10px] font-black uppercase tracking-widest"
              >
                <HelpCircle size={12} />
                Dynamic Placeholders
              </button>
            </div>

            {showTokenHelp && (
              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 text-xs text-gray-700 space-y-2 animate-in fade-in duration-200">
                <p className="font-bold text-primary">You can insert the following placeholders into your custom message:</p>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div><code className="bg-white border border-gray-100 px-1.5 py-0.5 rounded font-mono text-primary font-bold">{"{{guest_name}}"}</code> - Guest full name</div>
                  <div><code className="bg-white border border-gray-100 px-1.5 py-0.5 rounded font-mono text-primary font-bold">{"{{event_name}}"}</code> - Event title</div>
                  <div><code className="bg-white border border-gray-100 px-1.5 py-0.5 rounded font-mono text-primary font-bold">{"{{event_date}}"}</code> - Event calendar date</div>
                  <div><code className="bg-white border border-gray-100 px-1.5 py-0.5 rounded font-mono text-primary font-bold">{"{{event_time}}"}</code> - Event start time</div>
                  <div><code className="bg-white border border-gray-100 px-1.5 py-0.5 rounded font-mono text-primary font-bold">{"{{venue}}"}</code> - Physical address or Virtual link</div>
                </div>
              </div>
            )}

            <textarea
              value={reminderCustomText}
              onChange={(e) => onChange({ reminderCustomText: e.target.value })}
              rows={4}
              placeholder={defaults?.defaultTextTemplate || "⏰ Reminder: {{event_name}} is coming up!"}
              className="w-full p-4 bg-white border border-gray-300 rounded-2xl text-xs font-semibold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none placeholder:text-gray-400 shadow-sm leading-relaxed"
            />
          </div>

          {/* Frequencies settings */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Reminder Timing (Relative Offsets)
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={useDefaultFrequencies}
                  onChange={(e) => onChange({ useDefaultFrequencies: e.target.checked })}
                  className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4"
                />
                <span className="text-xs font-bold text-gray-700">Use System Default Frequencies</span>
              </label>
            </div>

            {useDefaultFrequencies ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {(defaults?.defaultFrequencies || [72, 24, 4]).map((freq) => (
                    <span
                      key={freq}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold"
                    >
                      {freq} hours before <span className="text-[9px] text-gray-400 font-normal">(System Default)</span>
                    </span>
                  ))}
                </div>
                <div className="p-4 bg-gray-100/50 border border-gray-200 rounded-2xl flex items-start gap-3">
                  <Info size={14} className="text-gray-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-medium text-gray-500 leading-relaxed uppercase">
                    Frequencies are set to defaults. If you want to use customized relative hours, uncheck &quot;Use System Default Frequencies&quot;.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Active custom frequencies list */}
                <div className="flex flex-wrap gap-2">
                  {reminderFrequencies.length === 0 ? (
                    <span className="text-xs text-gray-400 font-semibold italic">No custom timing configured. Add custom offsets below.</span>
                  ) : (
                    reminderFrequencies.map((freq) => (
                      <span
                        key={freq}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/20 text-primary rounded-xl text-xs font-bold transition-all hover:bg-primary/10"
                      >
                        {freq} hours before
                        <button
                          type="button"
                          onClick={() => handleRemoveFrequency(freq)}
                          className="text-primary hover:text-red-500 transition-colors focus:outline-none"
                          title="Remove timing"
                        >
                          <Trash2 size={12} />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Add Custom timing form */}
                <form onSubmit={handleAddFrequency} className="flex gap-2 max-w-sm">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 12"
                      value={customHourInput}
                      onChange={(e) => setCustomHourInput(e.target.value)}
                      className="w-full pl-4 pr-16 py-3 bg-white border border-gray-300 rounded-xl text-xs font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 uppercase tracking-widest pointer-events-none">
                      hours
                    </span>
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all text-xs shadow-md flex items-center gap-1.5 shrink-0"
                  >
                    <Plus size={14} />
                    Add Offset
                  </button>
                </form>
                {inputError && (
                  <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight ml-1">
                    {inputError}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
