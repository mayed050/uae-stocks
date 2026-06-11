# المزامنة التلقائية مع GitHub

هذا المستودع مُهيّأ بمزامنة تلقائية: **كل `git commit` يُدفَع فورًا إلى GitHub**.

## كيف يعمل
يوجد خطّاف `post-commit` محلي في `.git/hooks/post-commit` يقوم بعد كل التزام بـ:
1. `git push -u` إلى الفرع الحالي (الـ `-u` يربط الفروع الجديدة بـ origin تلقائيًا).
2. إن كان الفرع متأخّرًا (مثلاً بعد تحديث البيانات اليومي عبر Actions): `git pull --rebase --autostash` ثم الدفع.
3. عند تعذّر المزامنة **يطبع تحذيرًا صريحًا مع سبب الفشل** — لا يفشل بصمت أبدًا.

## إعادة إنشائه (عند استنساخ المستودع من جديد)
خطّافات Git **لا تُرفَع** مع المستودع، فأنشئ الملف يدويًا:

```sh
cat > .git/hooks/post-commit <<'EOF'
#!/bin/sh
branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null)"
[ -z "$branch" ] && exit 0
[ -n "$SKIP_AUTO_SYNC" ] && exit 0
export SKIP_AUTO_SYNC=1
if out=$(git push -u origin "$branch" 2>&1); then
  echo "🔄 مزامنة تلقائية: تم الدفع إلى origin/$branch"
else
  if git pull --rebase --autostash origin "$branch" >/dev/null 2>&1 \
     && git push -u origin "$branch" >/dev/null 2>&1; then
    echo "🔄 مزامنة تلقائية: أُعيد الأساس ثم الدفع إلى origin/$branch"
  else
    echo "⚠️ المزامنة التلقائية تعذّرت — ادفع يدويًا: git push -u origin $branch"
    echo "   سبب الفشل الأول: $(echo "$out" | tail -n 2)"
  fi
fi
exit 0
EOF
chmod +x .git/hooks/post-commit
```

## تعطيلها مؤقتًا
```sh
git commit --no-verify   # يتخطّى الخطّافات لهذا الالتزام فقط
```
أو احذف الملف: `rm .git/hooks/post-commit`
