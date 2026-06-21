
try:
    from pythainlp.transliterate import romanize
    text = "สวัสดีครับพี่ชาย"
    print(f"Original: {text}")
    print(f"Royin: {romanize(text, engine='royin')}")
    print(f"Thai2Rom: {romanize(text, engine='thai2rom')}")
except Exception as e:
    print(f"Error: {e}")
