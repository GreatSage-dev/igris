import wave, math, struct, os

out_dir = r"public/audio"
os.makedirs(out_dir, exist_ok=True)
sample_rate = 44100

def write_wav(filename, samples):
    filepath = os.path.join(out_dir, filename)
    with wave.open(filepath, 'w') as wav:
        wav.setnchannels(1) # Mono
        wav.setsampwidth(2) # 16-bit
        wav.setframerate(sample_rate)
        # Pack samples into 16-bit signed integers
        data = bytearray()
        for s in samples:
            # Clamp between -1.0 and 1.0
            clamped = max(-1.0, min(1.0, s))
            val = int(clamped * 32767.0)
            data += struct.pack('<h', val)
        wav.writeframes(data)
    print(f"[OK] Generated SFX: {filename} ({len(samples)} samples)")

# 1. SFX Riser / Sub-Bass Boom (2.5 seconds)
# Sweeps from 30Hz up to 110Hz with smooth fade-in and exponential decay
duration_riser = 2.5
num_samples_riser = int(sample_rate * duration_riser)
samples_riser = []
for i in range(num_samples_riser):
    t = i / sample_rate
    # Frequency glide
    freq = 32.0 + 80.0 * (t / duration_riser) ** 1.8
    phase = 2.0 * math.pi * freq * t
    # Envelope: gentle fade in, subtle swell, clean release
    env = math.sin(math.pi * (t / duration_riser)) ** 1.2
    sample = math.sin(phase) * 0.7 * env
    # Add subtle sub-harmonic
    sample += math.sin(phase * 0.5) * 0.3 * env
    samples_riser.append(sample)

write_wav("sfx_riser.wav", samples_riser)

# 2. SFX Digital Stamp / Impact Thud (1.2 seconds)
# High-energy transient click followed by deep resonant 55Hz sub-bass thump
duration_stamp = 1.2
num_samples_stamp = int(sample_rate * duration_stamp)
samples_stamp = []
for i in range(num_samples_stamp):
    t = i / sample_rate
    # Pitch drop from 180Hz to 45Hz
    freq = 45.0 + 135.0 * math.exp(-25.0 * t)
    phase = 2.0 * math.pi * freq * t
    # Transient click at t=0..0.02s
    click = (math.sin(2.0 * math.pi * 2400.0 * t) * math.exp(-120.0 * t)) * 0.4
    # Deep thump body
    body = math.sin(phase) * math.exp(-6.0 * t) * 0.85
    samples_stamp.append(click + body)

write_wav("sfx_stamp.wav", samples_stamp)

# 3. SFX Verification Chime (1.8 seconds)
# High crystalline harmonic bell chime (987.77Hz + 1975.5Hz) with shimmer
duration_chime = 1.8
num_samples_chime = int(sample_rate * duration_chime)
samples_chime = []
for i in range(num_samples_chime):
    t = i / sample_rate
    f1 = 987.77  # B5 note
    f2 = 1479.98 # F#6 fifth
    f3 = 1975.53 # B6 octave
    env = math.exp(-3.8 * t)
    s = (math.sin(2.0 * math.pi * f1 * t) * 0.5 +
         math.sin(2.0 * math.pi * f2 * t) * 0.3 +
         math.sin(2.0 * math.pi * f3 * t) * 0.2) * env
    samples_chime.append(s * 0.75)

write_wav("sfx_chime.wav", samples_chime)
