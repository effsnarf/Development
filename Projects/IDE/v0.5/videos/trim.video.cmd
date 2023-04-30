ffmpeg -i %1 -ss 00:00:00 -t 00:01:48 -c:v copy -c:a copy %1.trimmed.mp4
