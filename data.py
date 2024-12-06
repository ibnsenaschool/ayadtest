# قاعدة البيانات
database = [
    {
        "code": 9118,
        "number": 7239510,
        "name": "אנור אבו בדר",
        "class": "الاول 1"
    },
    {
        "code": 7179,
        "number": 7231967,
        "name": "מחמד אבו בדר",
        "class": "الاول 1"
    },
    {
        "code": 2999,
        "number": 7241686,
        "name": "סאמר אבו בדר",
        "class": "الاول 1"
    },
    {
        "code": 9899,
        "number": 7240032,
        "name": "עבד אלרחמן אבו בדר",
        "class": "الاول 1"
    }
]

# عرض البيانات
for student in database:
    print(f"الكود: {student['code']}")
    print(f"الرقم: {student['number']}")
    print(f"الاسم: {student['name']}")
    print(f"الصف: {student['class']}")
    print("-" * 30)
