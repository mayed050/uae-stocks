# المزامنة التلقائية مع GitHub

هذا المستودع مُهيّأ بمزامنة تلقائية: **كل `git commit` يُدفَع فورًا إلى GitHub**.

## كيف يعمل
يوجد خطّاف `post-commit` محلي في `.git/hooks/post-commit` يقوم بعد كل التزام بـ:
1. `git push` إلى الفرع الحالي.
2. إن كان الفرع متأخّرًا (مثلاً بعد تحديث البيانات اليومي عبر Actions): `git pull --rebase --autostash` ثم الدفع.

## إعادة إنشائه (عند استنساخ المستودع من جديد)
خطّافات Git **لا تُرفَع** مع المستودع، فأنشئ الملف يدويًا:

```sh
cat > .git/hooks/post-commit <<'EOF'
#!/bin/sh
branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null)"
[ -z "$branch" ] && exit 0
[ -n "$SKIP_AUTO_SYNC" ] && exit 0
export SKIP_AUTO_SYNC=1
git push origin "$branch" >/dev/null 2>&1 \
  || { git pull --rebase --autostash origin "$branch" >/dev/null 2>&1 && git push origin "$branch" >/dev/null 2>&1; }
exit 0
EOF
chmod +x .git/hooks/post-commit
```

## تعطيلها مؤقتًا
```sh
git commit --no-verify   # يتخطّى الخطّافات لهذا الالتزام فقط
```
أو احذف الملف: `rm .git/hooks/post-commit`
