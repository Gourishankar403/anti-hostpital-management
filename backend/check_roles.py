import sqlite3

def check_db():
    conn = sqlite3.connect('bhm_homs.db')
    c = conn.cursor()
    c.execute("SELECT id, username, role FROM users")
    print(c.fetchall())
    conn.close()

if __name__ == "__main__":
    check_db()
