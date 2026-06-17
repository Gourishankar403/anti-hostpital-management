import sqlite3

def fix_db():
    conn = sqlite3.connect('bhm_homs.db')
    c = conn.cursor()
    c.execute("UPDATE requests SET request_type = 'NEW_BILL' WHERE id IN (2, 3, 4, 5)")
    conn.commit()
    conn.close()
    print('Request types fixed!')

if __name__ == "__main__":
    fix_db()
